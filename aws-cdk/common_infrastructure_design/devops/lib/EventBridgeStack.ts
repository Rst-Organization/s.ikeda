import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { CfnRule, CfnEventBus } from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';


interface EventBridgeStackProps extends StackProps {
    projectName: string;
    codeCommitRepoArn: string;
    envAccountId: string;
    deployRegion: string;
    targetBranch: string;
}


export class EventBridgeStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: EventBridgeStackProps) {
        super(scope, id, props);
    
        // Create the IAM Role
        const eventBridgeInvokeRole = new iam.Role(this, 'EventBridgeInvokeRole', {
            assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
        });

        // Grant the specified permissions to the role
        eventBridgeInvokeRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ['events:PutEvents'],
                resources: [`arn:aws:events:${props.deployRegion}:${props.envAccountId}:event-bus/default`],
            })
        );
        
        new CfnRule(this, `DevOpsCodeCommitEventRule-${props.projectName}`, {
            eventBusName: 'default',
            eventPattern: {
                source: ['aws.codecommit'],
                'detail-type': ['CodeCommit Repository State Change'],
                resources: [props.codeCommitRepoArn],
                detail: {
                    event: ['referenceUpdated', 'referenceCreated'],
                    referenceName: [props.targetBranch]
                }
            },
            name: `${props.projectName}-update-codecommit-${props.targetBranch}`,
            state: 'ENABLED',
            targets: [{
                id: 'Idd5270d0b-5532-4c56-b31a-622bc94d0a46', //AWSで指定されているEventBusServiceのId(固定値)
                arn: `arn:aws:events:${props.deployRegion}:${props.envAccountId}:event-bus/default`,
                roleArn: eventBridgeInvokeRole.roleArn
            }]
        });
    };
}