/**
 * Copyright 2018 OpenCensus Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {types} from '@opencensus/opencensus-core';
import {classes} from '@opencensus/opencensus-core';
import {logger} from '@opencensus/opencensus-core';
import * as http from 'http';
import * as url from 'url';

export interface ZipkinExporterOptions extends types.ExporterConfig {
  url: string;
  serviceName: string;
}

interface TranslatedSpan {
  traceId: string;
  name: string;
  id: string;
  parentId?: string;
  kind: string;
  timestamp: string;
  duration: string;
  debug: boolean;
  shared: boolean;
  localEndpoint: {serviceName: string};
}

/** Zipkin Exporter manager class */
export class ZipkinTraceExporter implements types.Exporter {
  private zipkinUrl: url.UrlWithStringQuery;
  private serviceName: string;
  buffer: classes.ExporterBuffer;
  logger: types.Logger;

  constructor(options: ZipkinExporterOptions) {
    this.zipkinUrl = url.parse(options.url);
    this.serviceName = options.serviceName;
    this.buffer = new classes.ExporterBuffer(this, options);
    this.logger = options.logger || logger.logger();
  }

  /**
   * Is called whenever a span is ended.
   * @param root the ended span
   */
  onEndSpan(root: types.RootSpan) {
    this.buffer.addToBuffer(root);
  }

  /**
   * Send a trace to zipkin service
   * @param zipkinTraces Trace translated to Zipkin Service
   */
  private async sendTraces(zipkinTraces: TranslatedSpan[]) {
    /** Request options */
    const options = {
      hostname: this.zipkinUrl.hostname,
      port: this.zipkinUrl.port,
      path: this.zipkinUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    return new Promise((resolve, reject) => {
      try {
        /** Request object */
        const req = http.request(options, (res) => {
          res.on('data', (chunk) => {});
          // Resolve on end
          res.on('end', () => {
            resolve(
                {statusCode: res.statusCode, statusMessage: res.statusMessage});
          });
        });

        /** Request error event */
        req.on('error', (e) => {
          reject({
            statusCode: 500,
            statusMessage: `Problem with request: ${e.message}`
          });
        });

        /** Request body */
        const spansJson: string[] =
            zipkinTraces.map((span) => JSON.stringify(span));
        spansJson.join('');
        const outputJson = `[${spansJson}]`;
        this.logger.debug('Zipkins span list Json: %s', outputJson);

        // Sendind the request
        req.write(outputJson, 'utf8');
        req.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Mount a list (array) of spans translated to Zipkin format
   * @param rootSpan Trace to be translated
   */
  private mountSpanList(spanList: TranslatedSpan[], rootSpan: types.RootSpan):
      TranslatedSpan[] {
    /** RootSpan data */
    const spanRoot = this.translateSpan(rootSpan);
    spanList.push(spanRoot);

    // Builds spans data
    for (const span of rootSpan.spans) {
      spanList.push(this.translateSpan(span, rootSpan));
    }

    return spanList;
  }

  /**
   * Translate OpenSensus Span to Zipkin format
   * @param span Span to be translated
   * @param rootSpan Only necessary if the span has rootSpan
   */
  private translateSpan(
      span: types.Span|types.RootSpan,
      rootSpan?: types.RootSpan): TranslatedSpan {
    const spanTraslated = {
      traceId: span.traceId,
      name: span.name,
      id: span.id,
      kind: 'SERVER',
      timestamp: (span.startTime.getTime() * 1000).toFixed(),
      duration: (span.duration * 1000).toFixed(),
      debug: true,
      shared: true,
      localEndpoint: {serviceName: this.serviceName}
    } as TranslatedSpan;

    if (rootSpan) {
      spanTraslated.parentId = rootSpan.id;
    }

    return spanTraslated;
  }

  /**
   * Send the rootSpans to zipkin service
   * @param rootSpans RootSpan array
   */
  publish(rootSpans: types.RootSpan[]) {
    let zipkinTraces: TranslatedSpan[] = [];
    for (const trace of rootSpans) {
      zipkinTraces = this.mountSpanList(zipkinTraces, trace);
    }

    return this.sendTraces(zipkinTraces)
        .then((result) => {
          return result;
        })
        .catch((err) => {
          return err;
        });
  }
}
