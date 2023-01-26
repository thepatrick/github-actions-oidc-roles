import * as aws from '@pulumi/aws';
import { ssm } from '@pulumi/aws';
import { ParameterType } from '@pulumi/aws/ssm';
import { interpolate, output } from '@pulumi/pulumi';

const { accountId } = output(aws.getCallerIdentity());

const oidcProvider = new aws.iam.OpenIdConnectProvider('github-oidc', {
  url: 'https://token.actions.githubusercontent.com',
  clientIdLists: ['sts.amazonaws.com'],
  thumbprintLists: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
});

const oidcParameter = new ssm.Parameter('github-oidc', {
  name: 'github-oidc-provider',
  type: ParameterType.String,
  value: oidcProvider.arn,
});

const readGithubOIDCProvider = new aws.iam.Policy('read-github-oidc-provider', {
  path: '/github-actions-root/',
  name: 'ReadGithubOIDCProvider',
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['ssm:Get*'],
        Resource: oidcParameter.arn,
      },
    ],
  },
});

const iamManagement = new aws.iam.Policy('iam-management', {
  path: '/github-actions-root/',
  name: 'AllowGithubActionsIAMManagement',
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'iam:AttachRolePolicy',
          'iam:CreateRole',
          'iam:DeleteRole',
          'iam:DeleteRolePolicy',
          'iam:DetachRolePolicy',
          'iam:GetRole',
          'iam:GetRolePolicy',
          'iam:ListAttachedRolePolicies',
          'iam:ListRolePolicies',
          'iam:ListRoleTags',
          'iam:PutRolePermissionsBoundary',
          'iam:PutRolePolicy',
          'iam:TagRole',
          'iam:UntagRole',
          'iam:UpdateAssumeRolePolicy',
          'iam:UpdateRole',
          'iam:UpdateRoleDescription',
        ],
        Resource: [
          interpolate`arn:aws:iam::${accountId}:role/github-actions/*`,
          interpolate`arn:aws:iam::${accountId}:policy/github-actions/*`,
        ],
      },
    ],
  },
});

const githubOidcRolesMerge = new aws.iam.Role('thepatrick/github-actions-oidc-roles/merge', {
  path: `/github-actions-root/thepatrick/`,
  name: 'github-actions-oidc-roles-merge',
  managedPolicyArns: [iamManagement.arn, readGithubOIDCProvider.arn],
  assumeRolePolicy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 'sts:AssumeRoleWithWebIdentity',
        Principal: { Federated: oidcProvider.arn },
        Condition: {
          StringLike: {
            'token.actions.githubusercontent.com:sub': [
              'repo:thepatrick/github-actions-oidc-roles:ref:refs/heads/main',
            ],
          },
        },
      },
    ],
  },
});

const pulumiMergeRole = new aws.iam.Role('thepatrick/thepatrick.cloud.tf/merge', {
  namePrefix: 'thepatrick-cloud-tf-actions-merge',
  managedPolicyArns: ['arn:aws:iam::aws:policy/AdministratorAccess'],
  assumeRolePolicy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 'sts:AssumeRoleWithWebIdentity',
        Principal: { Federated: oidcProvider.arn },
        Condition: {
          StringLike: {
            'token.actions.githubusercontent.com:sub': [
              'repo:thepatrick/thepatrick.cloud.tf:ref:refs/heads/live',
              'repo:p2-network/art:ref:refs/heads/main',
            ],
          },
        },
      },
    ],
  },
});

const pulumiPreviewRole = new aws.iam.Role('thepatrick/thepatrick.cloud.tf/preview', {
  namePrefix: 'thepatrick-cloud-tf-actions-pr',
  managedPolicyArns: ['arn:aws:iam::aws:policy/AdministratorAccess'],
  assumeRolePolicy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 'sts:AssumeRoleWithWebIdentity',
        Principal: { Federated: oidcProvider.arn },
        Condition: {
          StringLike: {
            'token.actions.githubusercontent.com:sub': ['repo:thepatrick/thepatrick.cloud.tf:pull_request'],
          },
        },
      },
    ],
  },
});

const readOnlyRole = new aws.iam.Role('thepatrick/github-actions/read-only', {
  path: '/github-actions/',
  namePrefix: 'actions-pr-readonly',
  managedPolicyArns: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
  assumeRolePolicy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 'sts:AssumeRoleWithWebIdentity',
        Principal: { Federated: oidcProvider.arn },
        Condition: {
          StringLike: {
            'token.actions.githubusercontent.com:sub': ['repo:p2-network/art:pull_request'],
          },
        },
      },
    ],
  },
});

export const pulumiGithubActionsOidcRolesMerge = githubOidcRolesMerge.arn;
export const pulumiMergeRoleARN = pulumiMergeRole.arn;
export const pulumiPreviewRoleARN = pulumiPreviewRole.arn;
export const pulumiReadOnlyRoleARN = readOnlyRole.arn;
