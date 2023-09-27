import { Stack, CfnOutput, Fn } from 'aws-cdk-lib';
import { CfnRule, CfnEventBusPolicy } from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * EventBridgeを作成
 * @param stack construct
 * @param deploymentStage string
 * @param projectName string
 * @param codeCommitRepositoryArn string
 * @param envAccountId string パイプランを実行するアカウントID
 * @param devopsAccountId codeCommitのリポジトリを作成したアカウントID
 * @param pipelineArn CodePipelineのArn
 * @param targetBranch string
 */

const createEventBridge = (
    stack: Stack,
    deploymentStage: string,
    projectName: string, 
    codeCommitRepositoryArn: string, 
    envAccountId: string, 
    devopsAccountId: string, 
    pipelineArn: string,
    targetBranch: string): void => {

    // Create the EventBridge IAM Role
    const invokeCodePipelineRole = new iam.Role(stack, 'InvokeCodePipelineRole', {
        assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
    });

    // Grant the specified permissions to the role
    invokeCodePipelineRole.addToPolicy(
        new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['codepipeline:StartPipelineExecution'],
            resources: ['*'],
        })
    );

    new CfnEventBusPolicy(stack, 'EventBusPolicy0', {
        statementId: 'AllowAccountToPutEvents',
        eventBusName: 'default',
        statement: {
            Sid: 'AllowAccountToPutEvents',
            Effect: 'Allow',
            Principal: {
                AWS: `arn:aws:iam::${devopsAccountId}:root`
            },
            Action: 'events:PutEvents',
            Resource: Fn.sub(`arn:aws:events:${stack.region}:${envAccountId}:event-bus/default`, {
                Region: stack.region
            })
        }
    });

    new CfnRule(stack, `DevOpsCodeCommitEventRule-${projectName}`, {
        eventBusName: 'default',
        eventPattern: {
            source: ['aws.codecommit'],
            'detail-type': ['CodeCommit Repository State Change'],
            resources: [codeCommitRepositoryArn],
            detail: {
                event: ['referenceUpdated', 'referenceCreated'],
                referenceName: [targetBranch]
            }
        },
        name: `${deploymentStage}-${projectName}-update-codecommit-${targetBranch}`,
        state: 'ENABLED',
        targets: [{
            id: 'Idd24c2c79-0010-4677-ae5e-9fcb51d29844', //AWSで指定されているPipelineServiceId
            arn: pipelineArn,
            roleArn: invokeCodePipelineRole.roleArn
        }]
    });
}

export default createEventBridge;