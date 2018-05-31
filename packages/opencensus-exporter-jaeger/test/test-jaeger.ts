/**
 * Copyright 2018, OpenCensus Authors
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
import * as assert from 'assert';
import * as fs from 'fs';
import * as mocha from 'mocha';
import * as nock from 'nock';
import * as shimmer from 'shimmer';


import {JaegerTraceExporter, JaegerTraceExporterOptions} from '../src/';
import UDPSender from '../src/jaeger-driver/udp_sender';

const DEFAULT_BUFFER_TIMEOUT = 10;  // time in milliseconds

/**
 * Controls if the tests will use a real network or not
 * true to use a real zipkin service
 * false to use a nock server
 */
const OPENCENSUS_NETWORK_TESTS =
    ['true', 'TRUE', '1'].indexOf(process.env.OPENCENSUS_NETWORK_TESTS) > -1;


describe('Jeager Exporter', () => {
  const testLogger = logger.logger('debug');
  const dryrun = !OPENCENSUS_NETWORK_TESTS;
  let exporterOptions: JaegerTraceExporterOptions;
  let exporter: JaegerTraceExporter;
  let tracer: classes.Tracer;


  before(() => {
    if (dryrun) {
      mockUDPSender();
    }
    testLogger.debug('dryrun=%s', dryrun);
    exporterOptions = {
      serviceName: 'opencensus-exporter-jaeger',
      host: 'localhost',
      port: 6832,
      tags: [{key: 'opencensus-exenvporter-jeager', value: '0.0.1'}],
      bufferTimeout: DEFAULT_BUFFER_TIMEOUT,
      logger: testLogger,
      maxPacketSize: 1000
    } as JaegerTraceExporterOptions;
  });

  beforeEach(() => {
    exporter = new JaegerTraceExporter(exporterOptions);
    tracer = new classes.Tracer();
    tracer.start({samplingRate: 1});
    tracer.registerSpanEventListener(exporter);
  });

  afterEach(() => {
    exporter.close();
  });


  /* Should export spans to Jeager */
  describe('publish()', () => {
    it('should export spans to Jeager', () => {
      return tracer.startRootSpan({name: 'root-s01'}, async (rootSpan) => {
        const span = tracer.startChildSpan('child-s01');
        span.end();
        rootSpan.end();

        return exporter.publish([rootSpan]).then((result) => {
          assert.strictEqual(result, 2);
        });
      });
    });
  });


  describe('addToBuffer force flush by timeout ', () => {
    it('should flush by timeout', (done) => {
      assert.strictEqual(exporter.spanBuffer.length, 0);
      tracer.startRootSpan({name: 'root-s02'}, (rootSpan) => {
        const span = tracer.startChildSpan('child-s02');
        span.end();
        rootSpan.end();

        assert.strictEqual(exporter.successBuffer.length, 0);
        setTimeout(() => {
          assert.strictEqual(exporter.successBuffer.length, 2);
          done();
        }, DEFAULT_BUFFER_TIMEOUT * 2 + 100);
      });
    });
  });
});

function mockUDPSender() {
  shimmer.wrap(UDPSender.prototype, 'flush', (original) => {
    return (callback) => callback(2);
  });
}
