import { observer } from 'mobx-react';
import * as React from 'react';

import { Badge, DarkRightPanel, H2, MiddlePanel, Row } from '../../common-elements';

import { ShareLink } from '../../common-elements/linkify';

import { OperationModel as OperationType, SecuritySchemesModel } from '../../services/models';
import styled from '../../styled-components';
import { Endpoint } from '../Endpoint/Endpoint';
import { ExternalDocumentation } from '../ExternalDocumentation/ExternalDocumentation';
import { Extensions } from '../Fields/Extensions';
import { Markdown } from '../Markdown/Markdown';

import { OptionsContext } from '../OptionsProvider';
import { Parameters } from '../Parameters/Parameters';
import { RequestSamples } from '../RequestSamples/RequestSamples';
import { ResponsesList } from '../Responses/ResponsesList';
import { ResponseSamples } from '../ResponseSamples/ResponseSamples';
import { SecurityRequirements } from '../SecurityRequirement/SecurityRequirement';

const OperationRow = styled(Row)`
  backface-visibility: hidden;
  contain: content;

  overflow: hidden;
`;

const Description = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.unit * 6}px;
`;

export interface OperationProps {
  operation: OperationType;
  securitySchemes: SecuritySchemesModel;
}

export interface OperationState {
  executeMode: boolean;
  urlIndex: number;
}

@observer
export class Operation extends React.Component<OperationProps, OperationState> {
  constructor(props) {
    super(props);
    this.state = {
      executeMode: false,
      urlIndex: 0,
    };
  }

  onConsoleClick = () => {
    this.setState({
      executeMode: !this.state.executeMode,
    });
  };

  render() {
    const { operation, securitySchemes } = this.props;
    const { urlIndex } = this.state;

    const { name: summary, description, deprecated, externalDocs } = operation;
    const hasDescription = !!(description || externalDocs);
    var ConsoleViewerObj = {
      urlIndex,
      operation,
      securitySchemes,
    };

    return (
      <OptionsContext.Consumer>
        {options => (
          <OperationRow>
            <MiddlePanel>
              <H2>
                <ShareLink to={operation.id} />
                {summary} {deprecated && <Badge type="warning"> Deprecated </Badge>}
              </H2>
              {options.pathInMiddlePanel && (
                <Endpoint operation={operation} inverted={true} handleUrl={this.onUrlChanged} />
              )}
              {hasDescription && (
                <Description>
                  {description !== undefined && <Markdown source={description} />}
                  {externalDocs && <ExternalDocumentation externalDocs={externalDocs} />}
                </Description>
              )}
              <Extensions extensions={operation.extensions} />
              <SecurityRequirements securities={operation.security} />
              <Parameters parameters={operation.parameters} body={operation.requestBody} />
              <ResponsesList responses={operation.responses} />
            </MiddlePanel>
            <DarkRightPanel>
              {!options.pathInMiddlePanel && (
                <Endpoint operation={operation} handleUrl={this.onUrlChanged} />
              )}
              {
                <RequestSamples
                  operation={operation}
                  consoleViewerObj={Object.assign(ConsoleViewerObj, { requestSample: true })}
                />
              }
              {<ResponseSamples operation={operation} />}
            </DarkRightPanel>
          </OperationRow>
        )}
      </OptionsContext.Consumer>
    );
  }
  onUrlChanged = (index = 0) => {
    this.setState({
      urlIndex: index,
    });
  };
}
