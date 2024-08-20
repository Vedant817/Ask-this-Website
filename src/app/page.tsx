"use client";
import ChatWrapper from "@/components/ChatWrapper";
import { ragChat } from "@/lib/rag-chat";
import { redis } from "@/lib/redis";
import React, { useState, useEffect } from "react";
import { reconstructUrl } from "@/utils/recontructUrl";
import { cookies } from "next/headers";
import { UpstashDict, UpstashMessage } from "@upstash/rag-chat";

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<null | string>(null);
  const [initialMessages, setInitialMessages] = useState<UpstashMessage<UpstashDict>[]>([]);

  useEffect(() => {
    // Generate the sessionId when the page loads
    const sessionCookie = cookies().get("sessionId")?.value || '';
    const initialSessionId = ("session--" + sessionCookie).replace(/\//g, "");
    setSessionId(initialSessionId);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const reconstructedUrl = reconstructUrl(url);
    if (!reconstructedUrl) {
      alert("Please enter a valid URL");
      setIsLoading(false);
      return;
    }
    const fullSessionId = (reconstructedUrl + "--" + sessionId).replace(/\//g, "");
    const isAlreadyIndexed = await redis.sismember("urls", reconstructedUrl);
    const messages = await ragChat.history.getMessages({ amount: 10, sessionId: fullSessionId });

    if (!isAlreadyIndexed) {
      try {
        await ragChat.context.add({
          type: 'html',
          source: reconstructedUrl,
          config: {
            chunkOverlap: 50,
            chunkSize: 200
          },
        });
        console.log('Submitted URL:', reconstructedUrl);

        await redis.sadd("urls", reconstructedUrl);
        setUrl('');
      } catch (error) {
        console.error("Error processing URL:", error);
        alert("An error occurred while processing the URL");
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    // Update the sessionId with the full session identifier after form submission
    setSessionId(fullSessionId);
    setInitialMessages(messages);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8">
        <div className="mb-4">
          <label htmlFor="url" className="block text-gray-700 text-sm font-bold mb-2">
            Enter Website URL:
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://example.com"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'
            } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {initialMessages.length > 0 && (
        <ChatWrapper sessionId={sessionId} initialMessages={initialMessages} />
      )}
    </main>
  );
}
