import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGetLesson, getGetLessonQueryKey } from '@workspace/api-client-react';
import {
  ArrowLeft, CheckCircle2, Loader2, AlertCircle,
  Download, Upload, Globe, Lock, Eye, Play, Youtube
} from 'lucide-react';
import { getStoryboardsByLesson, generateStoryboard, getCreditBalance } from '@/lib/api';
import type { StoryboardResult } from '@/lib/api';
import { renderPreview, renderExport, getRenderJob } from '@/lib/api';
import RenderProgress from '@/components/RenderProgress';
import { connectYouTube, uploadToYouTube } from '@/lib/api';

export default function ExportPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const id = parseInt(params.id || '0', 10);
  const [storyboard, setStoryboard] = useState<StoryboardResult | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishDone, setPublishDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'unlisted'>('private');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [watchUrl, setWatchUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const { data: lesson, isLoading } = useGetLesson(id, {
    query: { enabled: !!id, queryKey: getGetLessonQueryKey(id) }
  });

  useEffect(() => {
    if (!id) return;
    getStoryboardsByLesson(id).then((boards) => {
      if (boards && boards.length > 0) setStoryboard(boards[0]);
    }).catch(() => {});
  }, [id]);

  const [dbJobId, setDbJobId] = useState<number | null>(null);

  const handleExport = async () => {
    if (!storyboard) return;
    setExporting(true);
    setError(null);
    setProgress(0);
    setDbJobId(null);
    try {
      const result = await renderExport({ storyboardId: storyboard.id });
      setDbJobId(result.jobId);
      setDownloadUrl(`/api/renderer/output/${result.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleRenderComplete = () => {
    setExportDone(true);
    setProgress(100);
  };

  const handleRenderError = (error: string) => {
    setError(error);
  };

  const handleConnectYouTube = async () => {
    try {
      const result = await connectYouTube();
      setYoutubeConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const handlePublish = async () => {
    if (!downloadUrl) return;
    setPublishing(true);
    setError(null);
    try {
      const result = await uploadToYouTube({
        jobId: parseInt(downloadUrl.split('/').pop() || '0', 10),
        title: lesson?.title ?? 'Untitled lesson',
        description: `Educational lesson created with EduWhiteboard.`,
        privacyStatus,
      });
      setWatchUrl(result.watchUrl);
      setPublishDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publishing failed');
    } finally {
      setPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-background font-sans text-foreground flex flex-col">
      <header className="h-14 px-4 bg-card border-b border-border flex items-center gap-4 shrink-0">
        <button
          onClick={() => setLocation(`/lessons/${id}`)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="w-px h-4 bg-border" />
        <span className="font-serif font-bold text-lg text-foreground">
          {lesson?.title ?? 'Export'}
        </span>
      </header>

      <main className="flex-1 overflow-auto p-8 max-w-2xl mx-auto w-full">
        <h1 className="font-serif text-2xl font-bold mb-6 text-foreground">Export Lesson</h1>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Step 1: Export */}
        <div className="bg-card border border-border rounded-xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              exportDone ? 'bg-green-100 text-green-700' : 'bg-secondary text-secondary-foreground'
            }`}>
              {exportDone ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <div>
              <h3 className="font-medium text-card-foreground">Render MP4</h3>
              <p className="text-xs text-muted-foreground">
                Generate the canonical 1080p whiteboard video
              </p>
            </div>
          </div>

          {!exportDone ? (
            <button
              onClick={handleExport}
              disabled={exporting || !storyboard}
              className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              data-testid="button-export-video"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? `Rendering ${progress}%...` : 'Render Video'}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Video rendered successfully
            </div>
          )}

          {dbJobId && !exportDone && (
            <div className="mt-2">
              <RenderProgress
                dbJobId={dbJobId}
                onComplete={handleRenderComplete}
                onError={handleRenderError}
                compact={false}
              />
            </div>
          )}
          {exporting && !dbJobId && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Queuing render job...
            </div>
          )}
        </div>

        {/* Step 2: YouTube Publishing */}
        <div className="bg-card border border-border rounded-xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              publishDone ? 'bg-green-100 text-green-700' :
              'bg-muted text-muted-foreground'
            }`}>
              {publishDone ? <CheckCircle2 className="w-5 h-5" /> : '2'}
            </div>
            <div>
              <h3 className="font-medium text-card-foreground">Publish to YouTube</h3>
              <p className="text-xs text-muted-foreground">
                Upload to your YouTube channel with controlled visibility
              </p>
            </div>
          </div>

          {!exportDone && (
            <p className="text-xs text-muted-foreground">Render the video first to enable publishing.</p>
          )}

          {exportDone && !youtubeConnected && !publishDone && (
            <button
              onClick={handleConnectYouTube}
              className="bg-secondary hover:opacity-90 text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              data-testid="button-connect-youtube"
            >
              <Youtube className="w-4 h-4" />
              Connect YouTube
            </button>
          )}

          {youtubeConnected && !publishDone && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                YouTube connected
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPrivacyStatus('private')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    privacyStatus === 'private'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Private
                </button>
                <button
                  onClick={() => setPrivacyStatus('unlisted')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    privacyStatus === 'unlisted'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Unlisted
                </button>
              </div>

              <button
                onClick={handlePublish}
                disabled={publishing}
                className="bg-destructive hover:opacity-90 text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                data-testid="button-publish-youtube"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {publishing ? 'Uploading...' : `Publish as ${privacyStatus}`}
              </button>
            </div>
          )}

          {publishDone && watchUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Published to YouTube
              </div>
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-secondary hover:underline"
              >
                <Play className="w-4 h-4" />
                Watch on YouTube
              </a>
            </div>
          )}
        </div>

        {/* Summary */}
        {publishDone && (
          <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Export complete</p>
            <p>Your lesson has been rendered and published to YouTube as {privacyStatus}.</p>
          </div>
        )}
      </main>
    </div>
  );
}
