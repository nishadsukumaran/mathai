/**
 * @module app/whiteboard-demo/page
 *
 * Standalone demo page for the Whiteboard Teaching Demo (PoC).
 * Not linked from the main nav — access via /whiteboard-demo.
 */

import { WhiteboardDemo } from "@/components/whiteboard/WhiteboardDemo";

export default function WhiteboardDemoPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <h1 className="text-2xl font-black text-slate-900">Whiteboard Teaching Demo</h1>
        <p className="text-sm text-slate-500 mt-1">
          Proof of concept — one polished example of subtraction with borrowing.
        </p>
      </div>
      <WhiteboardDemo />
    </div>
  );
}
