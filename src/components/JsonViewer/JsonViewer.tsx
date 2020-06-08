import * as React from 'react';
import styled from '../../styled-components';
import { ConsoleViewer } from '../Console/ConsoleViewer';

import { SampleControls } from '../../common-elements';
import { CopyButtonWrapper } from '../../common-elements/CopyButtonWrapper';
import { PrismDiv } from '../../common-elements/PrismDiv';
import { jsonToHTML } from '../../utils/jsonToHtml';
import { OptionsContext } from '../OptionsProvider';
import { jsonStyles } from './style';

export interface JsonProps {
  data: any;
  className?: string;
  consoleViewerObj: any;
}

const JsonViewerWrap = styled.div`
  &:hover > ${SampleControls} {
    opacity: 1;
  }
`;

class Json extends React.PureComponent<JsonProps> {
  node: HTMLDivElement;

  state = {
    usingTryNow: false,
  };

  render() {
    return (
      <CopyButtonWrapper data={this.props.data} usingTryNow={this.state.usingTryNow}>
        {this.renderInner}
      </CopyButtonWrapper>
    );
  }

  renderInner = ({ renderCopyButton }) => {
    return (
      <div>
        <JsonViewerWrap>
          <SampleControls>
            {renderCopyButton()}
            <span onClick={this.expandAll}> Expand all </span>
            <span onClick={this.collapseAll}> Collapse all </span>
            {this.props.consoleViewerObj.requestSample && (
              <span
                onClick={() => {
                  const elements = this.node.getElementsByClassName('collapsible');
                  for (const collapsed of Array.prototype.slice.call(elements)) {
                    (collapsed.parentNode as Element)!.classList.add('ellipsis');
                  }
                  this.setState({
                    usingTryNow: true,
                  });
                }}
              >
                Try now
              </span>
            )}
          </SampleControls>
          <OptionsContext.Consumer>
            {options => (
              <PrismDiv
                className={this.props.className}
                // tslint:disable-next-line
                ref={node => (this.node = node!)}
                dangerouslySetInnerHTML={{
                  __html: jsonToHTML(this.props.data, options.jsonSampleExpandLevel),
                }}
              />
            )}
          </OptionsContext.Consumer>
        </JsonViewerWrap>
        <OptionsContext.Consumer>
          {options => {
            return (
              this.state.usingTryNow && (
                <ConsoleViewer
                  securitySchemes={this.props.consoleViewerObj.securitySchemes}
                  operation={this.props.consoleViewerObj.operation}
                  urlIndex={this.props.consoleViewerObj.urlIndex}
                  additionalHeaders={options.additionalHeaders}
                  queryParamPrefix={options.queryParamPrefix}
                  queryParamSuffix={options.queryParamSuffix}
                />
              )
            );
          }}
        </OptionsContext.Consumer>
      </div>
    );
  };

  expandAll = () => {
    const elements = this.node.getElementsByClassName('collapsible');
    for (const collapsed of Array.prototype.slice.call(elements)) {
      (collapsed.parentNode as Element)!.classList.remove('collapsed');
      (collapsed.parentNode as Element)!.classList.remove('ellipsis');
    }
    this.setState({
      usingTryNow: false,
    });
  };

  collapseAll = () => {
    const elements = this.node.getElementsByClassName('collapsible');
    for (const expanded of Array.prototype.slice.call(elements)) {
      // const collapsed = elements[i];
      if ((expanded.parentNode as Element)!.classList.contains('redoc-json')) {
        continue;
      }
      (expanded.parentNode as Element)!.classList.add('collapsed');
      (expanded.parentNode as Element)!.classList.remove('ellipsis');
    }
    this.setState({
      usingTryNow: false,
    });
  };

  clickListener = (event: MouseEvent) => {
    let collapsed;
    const target = event.target as HTMLElement;
    if (target.className === 'collapser') {
      collapsed = target.parentElement!.getElementsByClassName('collapsible')[0];
      if (collapsed.parentElement.classList.contains('collapsed')) {
        collapsed.parentElement.classList.remove('collapsed');
      } else {
        collapsed.parentElement.classList.add('collapsed');
      }
    }
  };

  componentDidMount() {
    this.node!.addEventListener('click', this.clickListener);
  }

  componentWillUnmount() {
    this.node!.removeEventListener('click', this.clickListener);
  }
}

export const JsonViewer = styled(Json)`
  ${jsonStyles};
`;
