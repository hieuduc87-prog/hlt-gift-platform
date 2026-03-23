"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface UploadResult {
  success: number;
  failed: number;
  total: number;
  errors: { row: number; message: string }[];
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (
      !f.name.endsWith(".xlsx") &&
      !f.name.endsWith(".xls")
    ) {
      setError("Chi chap nhan file Excel (.xlsx, .xls)");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/excel", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Co loi xay ra khi upload");
        return;
      }

      const data: UploadResult = await res.json();
      setResult(data);
    } catch {
      setError("Khong the ket noi den may chu");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/hoadinhky/recipients"
          className="p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Nhap tu Excel
          </h1>
          <p className="text-sm text-text-secondary">
            Upload file danh sach nguoi nhan
          </p>
        </div>
      </div>

      {/* Template info */}
      <Card padding="sm" className="mb-4 bg-gold-bg/30 border-gold/20">
        <div className="flex items-start gap-3">
          <FileSpreadsheet size={20} className="text-gold shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">
              Dinh dang file can co cac cot:
            </p>
            <p className="text-text-secondary">
              Ho ten* | SDT | Email | Quan he | Dia chi | Quan/Huyen | Sinh nhat (DD/MM) | Ghi chu
            </p>
            <p className="text-text-muted mt-1 text-xs">
              * Bat buoc. Hang dau tien la tieu de cot.
            </p>
          </div>
        </div>
      </Card>

      {/* Upload zone */}
      {!result ? (
        <Card padding="lg">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl py-12 px-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-gold bg-gold-bg/30"
                : file
                  ? "border-success bg-success-bg/30"
                  : "border-border hover:border-gold/50 hover:bg-gold-bg/10"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            {file ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet
                  size={40}
                  className="text-success mb-3"
                />
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-text-muted mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setError(null);
                  }}
                  className="mt-3 flex items-center gap-1 text-sm text-text-muted hover:text-error transition-colors"
                >
                  <X size={14} />
                  Chon file khac
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload
                  size={40}
                  className="text-text-muted mb-3"
                />
                <p className="font-medium text-foreground">
                  Keo tha file vao day
                </p>
                <p className="text-sm text-text-muted mt-1">
                  hoac click de chon file (.xlsx, .xls)
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-error-bg text-error text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {file && (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
              >
                Huy
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {uploading ? "Dang xu ly..." : "Bat dau nhap"}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        /* Results */
        <Card padding="lg">
          <div className="text-center mb-6">
            {result.success > 0 ? (
              <CheckCircle
                size={48}
                className="mx-auto text-success mb-3"
              />
            ) : (
              <AlertCircle
                size={48}
                className="mx-auto text-error mb-3"
              />
            )}
            <h2 className="text-lg font-semibold text-foreground">
              Ket qua nhap lieu
            </h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 rounded-lg bg-surface-hover">
              <p className="text-2xl font-bold text-foreground">
                {result.total}
              </p>
              <p className="text-xs text-text-muted">Tong dong</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-success-bg">
              <p className="text-2xl font-bold text-success">
                {result.success}
              </p>
              <p className="text-xs text-success">Thanh cong</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-error-bg">
              <p className="text-2xl font-bold text-error">
                {result.failed}
              </p>
              <p className="text-xs text-error">That bai</p>
            </div>
          </div>

          {/* Errors detail */}
          {result.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-2">
                Chi tiet loi:
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {result.errors.map((err, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-error-fg bg-error-bg rounded-lg px-3 py-2"
                  >
                    <Badge variant="error" size="sm">
                      Dong {err.row}
                    </Badge>
                    <span className="text-text-secondary">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFile(null);
                setResult(null);
                setError(null);
              }}
            >
              <Upload size={16} />
              Nhap tiep
            </Button>
            <Link href="/hoadinhky/recipients">
              <Button>Xem danh sach</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
