import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { HandlerToWebviewMessage, PathCompletionItem } from "@/adapters";
import "./InputCtrl.css";
import { useVsCode } from "@webview/views/chatView/contexts";
import { FileSelector, getPathToken, isFileSelectorNavigationKey, type PathToken } from "../fileSelector";

interface ReferencedFile {
  path: string;
  content?: string;
  type: "file" | "directory";
}

type Props = {
  input: string;
  setInput: (input: string) => void;
  isProcessing?: boolean;
  canSend?: boolean;
  selectedModelRef: { current: string };
  reasoningRef: { current: string };
  placeholder?: string;
  rows?: number;
  referencedFiles?: ReferencedFile[];
  onSend?: (text: string) => void;
};

const InputCtrl = forwardRef<HTMLTextAreaElement, Props>(
  (
    {
      input,
      setInput,
      isProcessing = false,
      canSend = true,
      selectedModelRef,
      reasoningRef,
      placeholder = "Type your message here...",
      rows = 1,
      referencedFiles,
      onSend,
    },
    ref,
  ) => {
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const requestIdRef = useRef(0);
    const activeRequestIdRef = useRef(0);
    const vscode = useVsCode();
    const [pathToken, setPathToken] = useState<PathToken | null>(null);
    const [completions, setCompletions] = useState<PathCompletionItem[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useImperativeHandle(ref, () => taRef.current!, [taRef]);

    useEffect(() => {
      const handleMessage = (event: MessageEvent<HandlerToWebviewMessage>) => {
        const message = event.data;
        if (message.type !== "pathCompletions" || message.requestId !== activeRequestIdRef.current) {
          return;
        }

        setCompletions(message.items);
        setActiveIndex(0);
      };

      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, []);

    const requestPathCompletions = useCallback(
      (value: string, cursor: number) => {
        const token = getPathToken(value, cursor);
        setPathToken(token);

        if (!token || !vscode) {
          setCompletions([]);
          return;
        }

        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        activeRequestIdRef.current = requestId;
        vscode.postMessage({ type: "getPathCompletions", requestId, query: token.query });
      },
      [vscode],
    );

    const handleSend = useCallback(() => {
      const text = input.trim();
      if (!text || !vscode || isProcessing) {
        return;
      }

      setInput("");
      setCompletions([]);
      setPathToken(null);
      onSend?.(text);
      vscode.postMessage({
        type: "sendMessage",
        text,
        modelId: selectedModelRef.current,
        reasoning: reasoningRef.current,
        referencedFiles: referencedFiles?.map((f) => ({
          path: f.path,
          content: f.content,
          type: f.type,
        })),
      });
    }, [input, vscode, isProcessing, setInput, selectedModelRef, reasoningRef, referencedFiles, onSend]);

    const handleCancel = useCallback(() => {
      vscode?.postMessage({ type: "cancelGeneration" });
    }, [vscode]);

    const insertCompletion = useCallback(
      (completion: PathCompletionItem) => {
        if (!pathToken) {
          return;
        }

        const textarea = taRef.current;
        const nextInput = `${input.slice(0, pathToken.start)}${completion.path}${input.slice(pathToken.end)}`;
        const cursor = pathToken.start + completion.path.length;
        setInput(nextInput);

        requestAnimationFrame(() => {
          if (!textarea) {
            return;
          }
          textarea.selectionStart = cursor;
          textarea.selectionEnd = cursor;
          textarea.focus();
          if (completion.type === "directory") {
            requestPathCompletions(nextInput, cursor);
          } else {
            setCompletions([]);
            setPathToken(null);
          }
        });
      },
      [input, pathToken, requestPathCompletions, setInput],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (completions.length > 0) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((index) => (index + 1) % completions.length);
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((index) => (index - 1 + completions.length) % completions.length);
            return;
          }
          if (e.key === "Tab" || e.key === "Enter") {
            e.preventDefault();
            insertCompletion(completions[activeIndex]);
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setCompletions([]);
            setPathToken(null);
            return;
          }
        }

        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      },
      [activeIndex, completions, handleSend, insertCompletion],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        requestPathCompletions(e.target.value, e.target.selectionStart);
      },
      [requestPathCompletions, setInput],
    );

    const handleCursorChange = useCallback(() => {
      const textarea = taRef.current;
      if (textarea) {
        requestPathCompletions(input, textarea.selectionStart);
      }
    }, [input, requestPathCompletions]);

    const handleKeyUp = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (isFileSelectorNavigationKey(e.key)) {
          return;
        }

        handleCursorChange();
      },
      [handleCursorChange],
    );

    return (
      <div className="inputCtrl">
        <FileSelector
          activeIndex={activeIndex}
          completions={completions}
          isOpen={completions.length > 0 && Boolean(pathToken)}
          onSelect={insertCompletion}
        />

        <textarea
          ref={taRef}
          className="Input"
          placeholder={placeholder}
          value={input}
          onChange={handleChange}
          onClick={handleCursorChange}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
          rows={rows}
          disabled={isProcessing}
        />
        {isProcessing ? (
          <button className="stopBtn inside" type="button" onClick={handleCancel} aria-label="Stop generation" data-tooltip="Stop generation">
            <span className="codicon codicon-debug-stop" aria-hidden="true" />
          </button>
        ) : (
          <button className="sendBtn inside" type="button" onClick={handleSend} disabled={!canSend} aria-label="Send message">
            <span className="codicon codicon-send" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  },
);

export default InputCtrl;
