import { iam } from '@pulumi/aws';
import { Input } from '@pulumi/pulumi';

export const mergeRole = ({
  org,
  repo,
  managedPolicyArns,
  oidcProviderArn,
  branches,
}: {
  org: string;
  repo: string;
  managedPolicyArns: Input<Input<string>[]>;
  oidcProviderArn: Input<string>;
  branches: string[];
}) =>
  new iam.Role(`${org}/${repo}/merge`, {
    path: `/github-actions/${org}/`,
    name: `${repo}-merge`,
    managedPolicyArns,
    assumeRolePolicy: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: 'sts:AssumeRoleWithWebIdentity',
          Principal: { Federated: oidcProviderArn },
          Condition: {
            StringLike: {
              'token.actions.githubusercontent.com:sub': [
                ...branches.map((branch) => `repo:${org}/${repo}:ref:refs/heads/${branch}`),
              ],
            },
          },
        },
      ],
    },
  });
