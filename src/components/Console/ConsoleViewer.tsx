import { observer } from 'mobx-react';
import * as React from 'react';
import { SubmitButton } from '../../common-elements/buttons';
import { FlexLayoutJustifyContent } from '../../common-elements/panels';
import {
  FieldModel,
  OperationModel,
  SecuritySchemeModel,
  SecuritySchemesModel,
} from '../../services/models';
import { ConsoleResponse } from '../ConsoleResponse/Response';
import { SmallSpinner } from '../Loading/Spinner.svg';
import { ConsoleEditor } from './ConsoleEditor';

const qs = require('qs');

export interface ConsoleViewerProps {
  operation: OperationModel;
  additionalHeaders?: object;
  queryParamPrefix?: string;
  queryParamSuffix?: string;
  securitySchemes: SecuritySchemesModel;
  urlIndex: number;
}

export interface ConsoleViewerState {
  result: any;
  loading: number;
}

export interface Schema {
  _$ref?: any;
}

@observer
export class ConsoleViewer extends React.Component<ConsoleViewerProps, ConsoleViewerState> {
  operation: OperationModel;
  additionalHeaders: object;
  visited = new Set();
  private consoleEditor: any;

  constructor(props) {
    super(props);
    this.state = {
      result: null,
      loading: 0,
    };
  }
  onClickSend = async () => {
    this.setState({
      loading: 1,
    });

    const ace = this.consoleEditor && this.consoleEditor.editor;
    const {
      operation,
      securitySchemes: { schemes },
      additionalHeaders = {},
      urlIndex = 0,
    } = this.props;

    let value = ace && ace.editor.getValue();

    const content = operation.requestBody && operation.requestBody.content;
    const mediaType = content && content.mediaTypes[content.activeMimeIdx];
    const endpoint = {
      method: operation.httpVerb,
      path: operation.servers[urlIndex].url + operation.path,
    };
    if (value) {
      value = JSON.parse(value);
    }
    const contentType = (mediaType && mediaType.name) || 'application/json';
    const contentTypeHeader = { 'Content-Type': contentType };

    const schemeMapper: Map<string, SecuritySchemeModel> = new Map<string, SecuritySchemeModel>();
    schemes.forEach(scheme => {
      schemeMapper.set(scheme.id, scheme);
    });

    const securityHeaders: Dict<string | undefined> = {};

    // operation.security.forEach(({ schemes: [{ id }] }) => {
    //   if (schemeMapper.has(id)) {
    //     // this part of code needs a ts-ignore because typescript couldn't detect that schemeMapper.get(id) -
    //     // has been checked to avoid token of undefined.
    //     // @ts-ignore
    //     securityHeaders[id] = schemeMapper.get(id).token;
    //   }
    // });
    const headers = { ...additionalHeaders, ...contentTypeHeader, ...securityHeaders };
    let result;
    try {
      result = await this.invoke(endpoint, value, headers);
      this.setState({
        result,
      });
    } catch (error) {
      this.setState({
        result: error,
      });
    }
    this.setState({
      loading: 0,
    });
  };

  /*
   * If we have a url like foo/bar/{uuid} uuid will be replaced with what user has typed in.
   */
  addParamsToUrl(url: string, params: FieldModel[]) {
    const queryParamPrefix = '{';
    const queryParamSuffix = '}';

    for (const fieldModel of params) {
      if (
        url.indexOf(`${queryParamPrefix}${fieldModel.name}${queryParamSuffix}`) > -1 &&
        fieldModel.$value.length > 0
      ) {
        url = url.replace(
          `${queryParamPrefix}${fieldModel.name}${queryParamSuffix}`,
          fieldModel.$value,
        );
      }
    }

    if (url.split(queryParamPrefix).length > 1) {
      throw Error(`** we have missing query params ** ${url}`);
    }

    return url;
  }

  async invoke(endpoint, body, headers = {}) {
    try {
      const { operation } = this.props;
      let url = this.addParamsToUrl(endpoint.path, operation.parameters || []);
      console.log('operation parameters are ', operation.parameters);
      if (endpoint.method.toLocaleLowerCase() === 'get') {
        url = url + '?' + qs.stringify(body || '');
      }
      let queryString = '';
      operation.parameters.map((fieldVal, index) => {
        if (fieldVal.in === 'query') {
          queryString = queryString + fieldVal.name + '=' + fieldVal.$value;
        }
        if (index !== operation.parameters.length - 1) {
          queryString = queryString + '&';
        }
      });
      if (url.includes('?')) {
        url = url + queryString;
      } else {
        url = url + '?' + queryString;
      }
      console.log('url is ', url);
      const curlHeaders: Array<string> = [];
      const myHeaders = new Headers();
      for (const [key, value] of Object.entries(headers)) {
        myHeaders.append(key, `${value}`);
        curlHeaders.push(`"${key}: ${value}"`);
      }
      const curl = `curl -X ${endpoint.method.toUpperCase()} "${url}" ${curlHeaders.length > 0 ? '-H ' + curlHeaders.join(' -H ') : ''} ${body ? '-d ' + JSON.stringify(body) : ''}`
      console.log('curl is ', curl);

      const request = new Request(url, {
        method: endpoint.method,
        redirect: 'manual',
        headers: myHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const response = await fetch(request);
      const content = await response.json();
      const { ok, status, statusText, redirected } = response;
      for (const [key, value] of Object.entries(response.headers)) {
        console.log('headers is ', key, `${value}`);
      }
      return {
        content,
        ok,
        status,
        statusText,
        redirected,
        headers: response.headers,
        url: response.url,
        curl,
      };
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    let { operation } = this.props;
    operation = operation || {};
    const requestBodyContent =
      operation.requestBody && operation.requestBody.content && operation.requestBody.content;
    const hasBodySample = requestBodyContent && requestBodyContent.hasSample;
    const mediaTypes =
      requestBodyContent && requestBodyContent.mediaTypes ? requestBodyContent.mediaTypes : [];
    const { result, loading } = this.state;
    return (
      <div>
        <h3> Request </h3>
        {hasBodySample && (
          <ConsoleEditor
            mediaTypes={mediaTypes}
            ref={(editor: any) => (this.consoleEditor = editor)}
          />
        )}
        <FlexLayoutJustifyContent>
          <SubmitButton onClick={this.onClickSend}>Send Request</SubmitButton>
          {<SmallSpinner color={'#fff'} loading={loading} />}
        </FlexLayoutJustifyContent>
        {result && <ConsoleResponse response={result} />}
      </div>
    );
  }
}
