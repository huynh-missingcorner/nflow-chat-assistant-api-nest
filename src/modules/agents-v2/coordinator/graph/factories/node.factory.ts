import { Injectable } from '@nestjs/common';

import { ClassifyIntentNode } from '../nodes/classify-intent.node';
import { HandleErrorNode } from '../nodes/handle-error.node';
import { HandleRetryNode } from '../nodes/handle-retry.node';
import { HandleSuccessNode } from '../nodes/handle-success.node';
import { ValidateClassificationNode } from '../nodes/validate-classification.node';
import { IntentCombinationValidator } from '../validators/intent-combination.validator';

export interface INodeFactory {
  createClassifyIntentNode(): ClassifyIntentNode;
  createValidateClassificationNode(): ValidateClassificationNode;
  createHandleSuccessNode(): HandleSuccessNode;
  createHandleErrorNode(): HandleErrorNode;
  createHandleRetryNode(): HandleRetryNode;
}

@Injectable()
export class NodeFactory implements INodeFactory {
  constructor(
    private readonly validator: IntentCombinationValidator,
    private readonly classifyIntentNode: ClassifyIntentNode,
    private readonly handleSuccessNode: HandleSuccessNode,
    private readonly handleErrorNode: HandleErrorNode,
    private readonly handleRetryNode: HandleRetryNode,
  ) {}

  createClassifyIntentNode(): ClassifyIntentNode {
    return this.classifyIntentNode;
  }

  createValidateClassificationNode(): ValidateClassificationNode {
    return new ValidateClassificationNode(this.validator);
  }

  createHandleSuccessNode(): HandleSuccessNode {
    return this.handleSuccessNode;
  }

  createHandleErrorNode(): HandleErrorNode {
    return this.handleErrorNode;
  }

  createHandleRetryNode(): HandleRetryNode {
    return this.handleRetryNode;
  }
}
