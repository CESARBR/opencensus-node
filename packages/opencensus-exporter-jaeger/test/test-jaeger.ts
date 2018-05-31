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
import * as assert from 'assert';
import * as mocha from 'mocha';

import {JaegerTraceExporter} from '../src/jaeger';
import {JaegerTraceExporterOptions} from '../src/options';
import * as constants from '../src/jaeger-driver/constants';

/** Jaeger tests */
describe('Jaeger Exporter', () => {

  let exporter: JaegerTraceExporter;
  let tracer: classes.Tracer;

  beforeEach(() => {
    const exporterOptions = {
      serviceName: 'opencensus-service',
      tags: [ { key: 'opencensus-service.version', value: '1.1.2' }],
      bufferTimeout: 2000,
      maxPacketSize: 600
    } as JaegerTraceExporterOptions;

    exporter = new JaegerTraceExporter(exporterOptions);
    tracer = new classes.Tracer();

    tracer.registerSpanEventListener(exporter);
    tracer.start({samplingRate: 1});
  });

  /** Should called when a rootSpan ended */
  describe('onEndSpan()', () => {
    it('Should called when a rootSpan ended', () => {
      const rootSpanOptions = {name: 'root-test'};
      tracer.startRootSpan(rootSpanOptions, (rootSpan) => {
        const span = rootSpan.startChildSpan('spanTest', 'spanType');
        span.end();
        rootSpan.end();
        assert.ok(true);
      });
    });
  });

  /** Should send traces to Jaeger service */
  describe('publish()', () => {
    it('should send traces to Jaeger service', () => {
      return tracer.startRootSpan({name: 'root-test'}, (rootSpan) => {
        
        const span = rootSpan.startChildSpan('spanTest', 'spanType');
        span.end();
        
        rootSpan.end();
        
        return exporter.publish([rootSpan]).then((result: string) => {
          if (result && result === 'sendTrace sucessfully'){
            assert.ok(true);
          } else {
            assert.ok(false);
          }
        });
      });
    });

    it('should send traces with attributes to Jaeger service', () => {
      return tracer.startRootSpan({name: 'root-test'}, (rootSpan) => {
        const span = rootSpan.startChildSpan('spanTest', 'spanType');
        span.addAttribute(constants.SAMPLER_TYPE_TAG_KEY, constants.SAMPLER_TYPE_CONST);
        span.addAttribute(constants.SAMPLER_PARAM_TAG_KEY, 'true');
        span.end();
        rootSpan.end();
        
        return exporter.publish([rootSpan]).then((result: string) => {
          if (result && result === 'sendTrace sucessfully'){
            assert.ok(true);
          } else {
            assert.ok(false);
          }
        });
      });
    });
  });
});