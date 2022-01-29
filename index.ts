import * as aws from '@pulumi/aws';

const oidcProvider = new aws.iam.OpenIdConnectProvider('github-oidc', {
  url: 'https://token.actions.githubusercontent.com',
  clientIdLists: ['sts.amazonaws.com'],
  thumbprintLists: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
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
            'token.actions.githubusercontent.com:sub': ['repo:thepatrick/thepatrick.cloud.tf:ref:refs/heads/main'],
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

export const pulumiMergeRoleARN = pulumiMergeRole.arn;
export const pulumiPreviewRoleARN = pulumiPreviewRole.arn;
