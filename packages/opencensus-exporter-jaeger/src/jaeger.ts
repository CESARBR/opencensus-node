/**
 * Copyright 2018, OpenCensus Authors *
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

import { types } from '@opencensus/opencensus-core';
import { classes } from '@opencensus/opencensus-core';
import { logger } from '@opencensus/opencensus-core';
import { Thrift } from 'thriftrw';
import * as http from 'http';
import * as url from 'url';
import * as os from 'os';
import * as path from 'path';
import * as process from 'process';

import UDPSender from './jaeger-driver/udp_sender';
import { Utils } from './jaeger-driver/util';
import { ThriftUtils } from './jaeger-driver/thrift';
import { Process, Tag } from './jaeger-driver/jaeger-thrift';
import * as constants from './jaeger-driver/constants';
import { JaegerTraceExporterOptions } from './options';
import { spawnSync } from 'child_process';

/** Jaeger Exporter manager class */
export class JaegerTraceExporter implements types.Exporter {

  process: Process;
  exporterBuffer: classes.ExporterBuffer;
  logger: types.Logger;
  failBuffer: types.SpanContext[] = [];
  sender: UDPSender;

  constructor(options: JaegerTraceExporterOptions) {
    this.logger = options.logger || logger.logger('debug');
    this.exporterBuffer = new classes.ExporterBuffer(this, options);
    this.sender = new UDPSender(options);

    const thriftTags = this.getThriftTags(options.tags);

    this.process = {
      serviceName: options.serviceName,
      tags: thriftTags
    };
    this.sender.setProcess(this.process);
  }

  private getThriftTags(optionsTags: Tag[]) {
    let hostTags = [
      { 'key': constants.JAEGER_CLIENT_VERSION_TAG_KEY, 'value': `Node-${process.version}` },
      { 'key': constants.TRACER_HOSTNAME_TAG_KEY, 'value': os.hostname() },
      { 'key': constants.PROCESS_IP, 'value': Utils.myIp() }
    ];

    if (optionsTags != null) {
      hostTags = hostTags.concat(optionsTags);
    }
    return optionsTags ? ThriftUtils.getThriftTags(hostTags) : [];
  }

  /** Not used for this exporter */
  onStartSpan(root: types.RootSpan) { }

  onEndSpan(root: types.RootSpan) {
    for (const span of root.spans) {
      this.sender.append(this.translateSpanToThrift(span), (numSpans, error) => {
        if (error) {
          console.log(error);
        }
        console.log('ok');
      });
    }
  }

  private sendTrace(traces) {
    return new Promise((resolve, reject) => {
      this.sender.flush((numSpans, err) => {
        if (err) {
          const errorMsg = `sendTrace error: ${err}`;
          this.logger.error(errorMsg);
          reject(errorMsg);
        } else {
          const successMsg = 'sendTrace sucessfully';
          this.logger.debug(successMsg);
          resolve(successMsg);
        }
      });
    });
  }

  publish(rootSpans: types.RootSpan[]) {
    return this.sendTrace(rootSpans).catch((err) => {
      return err;
    });
  }

  private translateAttributesToSpanTags(span: types.Span) {
    let tags = [];
    if (span.attributes) {
      const initialTags = [];
      Object.keys(span.attributes).forEach(key => {
        initialTags.push({ 'key': key, 'value': span.attributes[key] });
      });
      tags = ThriftUtils.getThriftTags(initialTags);
    }
    return tags;
  }

  private translateSpanToThrift(span: types.Span) {
    const parentSpanId = span.parentSpanId ? new Buffer(span.parentSpanId) : ThriftUtils.emptyBuffer;

    return {
      traceIdLow: Utils.encodeInt64(span.traceId),
      traceIdHigh: ThriftUtils.emptyBuffer,
      spanId: Utils.getRandom64(),  // new Buffer(span.id),
      parentSpanId: Utils.encodeInt64(parentSpanId),
      operationName: span.name,
      references: [],
      flags: 1,
      startTime: Utils.encodeInt64(span.startTime.getTime() * 1000), // to microsseconds
      duration: Utils.encodeInt64(span.duration * 1000),  // to microsseconds
      tags: this.translateAttributesToSpanTags(span),
      logs: []
    };
  }
}
