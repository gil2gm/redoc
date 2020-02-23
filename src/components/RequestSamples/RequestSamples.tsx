import { observer } from 'mobx-react';
import * as React from 'react';
import { isPayloadSample, OperationModel, RedocNormalizedOptions } from '../../services';
import { PayloadSamples } from '../PayloadSamples/PayloadSamples';
import { SourceCodeWithCopy } from '../SourceCode/SourceCode';
import { ConsoleViewer } from '../Console/ConsoleViewer';

import { RightPanelHeader, Tab, TabList, TabPanel, Tabs } from '../../common-elements';
import { OptionsContext } from '../OptionsProvider';

export interface RequestSamplesProps {
  operation: OperationModel;
  consoleViewerObj: any;
}

@observer
export class RequestSamples extends React.Component<RequestSamplesProps> {
  static contextType = OptionsContext;
  context: RedocNormalizedOptions;
  operation: OperationModel;

  render() {
    const { operation, consoleViewerObj } = this.props;
    const samples = operation.codeSamples;

    const hasSamples = samples.length > 0;
    const hideTabList = samples.length === 1 ? this.context.hideSingleRequestSampleTab : false;
    return (
      (hasSamples && (
        <div>
          <RightPanelHeader> Request samples </RightPanelHeader>

          <Tabs defaultIndex={0}>
            <TabList hidden={hideTabList}>
              {samples.map(sample => (
                <Tab key={sample.lang + '_' + (sample.label || '')}>
                  {sample.label !== undefined ? sample.label : sample.lang}
                </Tab>
              ))}
            </TabList>
            {samples.map(sample => (
              <TabPanel key={sample.lang + '_' + (sample.label || '')}>
                {isPayloadSample(sample) ? (
                  <div id="payloadSamples">
                    <PayloadSamples
                      content={sample.requestBodyContent}
                      consoleViewerObj={consoleViewerObj}
                    />
                  </div>
                ) : (
                  <SourceCodeWithCopy lang={sample.lang} source={sample.source} />
                )}
              </TabPanel>
            ))}
          </Tabs>
        </div>
      )) || (
        <OptionsContext.Consumer>
          {options => {
            return (
              <ConsoleViewer
                securitySchemes={this.props.consoleViewerObj.securitySchemes}
                operation={this.props.consoleViewerObj.operation}
                urlIndex={this.props.consoleViewerObj.urlIndex}
                additionalHeaders={options.additionalHeaders}
                queryParamPrefix={options.queryParamPrefix}
                queryParamSuffix={options.queryParamSuffix}
              />
            );
          }}
        </OptionsContext.Consumer>
      )
    );
  }
}
