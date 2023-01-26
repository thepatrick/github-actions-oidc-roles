import { ssm } from '@pulumi/aws';
import { mergeRole } from './src/mergeRole';

const oidcProvider = ssm.getParameterOutput({ name: 'github-oidc-provider' }).value;

export const artLambdaTestsMerge = mergeRole({
  org: 'p2-network',
  repo: 'ArtLambdaTests',
  oidcProviderArn: oidcProvider,
  managedPolicyArns: ['arn:aws:iam::aws:policy/AdministratorAccess'],
  branches: ['main'],
});
