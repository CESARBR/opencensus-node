# OpenCensus Libraries for Node.js
[![Gitter chat][gitter-image]][gitter-url]

OpenCensus Node.js is an implementation of OpenCensus, a toolkit for collecting application performance and behavior monitoring data. Right now OpenCensus for Node.js supports custom tracing and automatic tracing for HTTP and HTTPS.

The library is in alpha stage and the API is subject to change.

Please join [gitter](https://gitter.im/census-instrumentation/Lobby) for help or feedback on this project.

## Installation

Install OpenCensus with:

```bash
npm install @opencensus/nodejs
```

## Traces

### Instrumenting an Application

OpenCensus for Node.js has automatic instrumentation for [HTTP](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-instrumentation-http/README.md) and [HTTPS](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-instrumentation-https/README.md) out of the box. This means that spans are automatically created for operations of those packages. To use it, simply start the tracing instance.

```javascript
var tracing = require('@opencensus/nodejs');
tracing.start();
```

Similarly for Typescript:

```typescript
import * as tracing from '@opencensus/nodejs';
tracing.start();
```

### Manualy Instrument an Application

In addition to automatic tracing, it is possible to manualy create your own root and child spans. 

```typescript
const rootSpanOptions = { name: 'your root span' };
tracing.tracer.startRootSpan(rootSpanOptions, (rootSpan) => {

    // You can create as many child spans as needed
    childSpan = tracing.tracer.startChildSpan(name: 'your child span');
    // Do some operation...
    // Finish the child span at the end of it's operation
    childSpan.end();

    // Finish the root span at the end of the operation
    rootSpan.end();
});
```

### Tracing Options

Tracing has many options available to choose from. At `tracing.start()`, you can set the following:

| Options | Type | Description |
| ------- | ---- | ----------- |
| [`bufferSize`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L25) | `number` | Maximum size of a buffer |
| [`bufferTimeout`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L27) | `number` | Max time for a buffer can wait before being sent |
| [`logger`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L29) | `Logger` | A logger object |
| [`samplingRate`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L35) | `number` | Determines the samplin rate. Ranges from 0.0 to 1.0 |
| [`ignoreUrls`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L37) | `Array<string>` | Determines the ignored (or blacklisted) URLs |
| [`logger`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L39) | `Logger` | A logger object |
| [`propagation`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L41) | `Propagation` | A propagation instance |
| [`logLevel`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L47) | `number` | Level of logger - 0:disable, 1: error, 2: warn, 3: info, 4: debug |
| [`maximumLabelValueSize`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L52) | `number` | The maximum number of characters reported on a label value |
| [`plugin`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L68) | `PluginNames` | A list of trace instrumentations plugins to load |
| [`exporter`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L70) | `Exporter` | An exporter object |
| [`logger`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L72) | `Logger` | An instance of a logger |

**TODO: Choose between the two options**

- [`bufferSize`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L25)
- [`bufferTimeout`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L27)
- [`logger`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L29)
- [`samplingRate`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L35)
- [`ignoreUrls`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L37)
- [`logger`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L39)
- [`propagation`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L41)
- [`logLevel`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L47)
- [`maximumLabelValueSize`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L52)
- [`plugin`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L68)
- [`exporter`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L70)
- [`logger`](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-core/src/trace/config/types.ts#L72)

## Propagation

OpenCensus collects distributed tracing. It is able to do so by propagating span data through services. Currently, OpenCensus supports:

- [B3 Propagation](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-propagation-b3/README.md)
- [Stackdriver Propagation](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-propagation-stackdriver/README.md)

## Exporters

OpenCensus can export trace data to various backends. Currently, OpenCensus supports:

- [Stackdriver](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-exporter-stackdriver/README.md)
- [Zipkin](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-exporter-zipkin/README.md)
- [Z-Pages](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-exporter-zpages/README.md)
- [Jaeger](https://github.com/census-instrumentation/opencensus-node/blob/master/packages/opencensus-exporter-jaeger/README.md)

If no exporter is registered in the tracing instance, as default, a console log exporter is used.

## Useful links
- For more information on OpenCensus, visit: <https://opencensus.io/>
- For help or feedback on this project, join us on [gitter](https://gitter.im/census-instrumentation/Lobby)

[gitter-image]: https://badges.gitter.im/census-instrumentation/lobby.svg
[gitter-url]: https://gitter.im/census-instrumentation/lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge

