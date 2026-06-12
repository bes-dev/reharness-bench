# Getting started with PipeForge

PipeForge turns a recorded session into a deterministic pipeline. Install the package, then run the
compiler on your trace. The runtime executes the pipeline and writes a verdict for every run.

## Quick steps
1. Install: `npm install -g pipeforge`
2. Compile your trace into a pipeline.
3. Run the pipeline; check the verdict in the logs.

If the verdict reports an error, the repair step reads the trace and fixes the failing stage.
