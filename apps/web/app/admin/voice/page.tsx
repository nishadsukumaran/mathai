/**
 * @module app/admin/voice/page
 *
 * Admin voice settings page — configure the dual TTS engine.
 */

import { AdminVoiceSettings } from "@/components/admin/AdminVoiceSettings";

export default function AdminVoicePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Voice Settings</h1>
      <p className="text-sm text-gray-500 mb-6">
        Configure how MathAI reads questions and explanations aloud.
      </p>
      <AdminVoiceSettings />
    </div>
  );
}
