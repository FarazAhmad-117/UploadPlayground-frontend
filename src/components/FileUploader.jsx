import { useState, useCallback, useEffect, useRef } from "react";
import {
  DropZone,
  Card,
  Button,
  Banner,
  BlockStack,
  Thumbnail,
  ProgressBar,
  Badge,
  InlineStack,
  Checkbox,
} from "@shopify/polaris";
import { NoteIcon, DeleteIcon } from "@shopify/polaris-icons";
import axios from "axios";

const server = import.meta.env.VITE_API_BASE_URL;

const FileUploader = () => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [activeUploads, setActiveUploads] = useState(0);
  const [errors, setErrors] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const processingRef = useRef(false);
  const MAX_CONCURRENT_UPLOADS = 2;

  const dropTimeout = useRef(null);
  const handleDrop = useCallback((_droppedFiles, acceptedFiles) => {
    if (dropTimeout.current) clearTimeout(dropTimeout.current);
    dropTimeout.current = setTimeout(() => {
      addToQueue(acceptedFiles);
    }, 100);
  }, []);

  const addToQueue = (newFiles) => {
    setUploadQueue((prev) => {
      const existingFileSet = new Set(
        prev.map((item) => item.file.name + item.file.size)
      );
      const uniqueFiles = newFiles.filter(
        (file) => !existingFileSet.has(file.name + file.size)
      );

      return [
        ...prev,
        ...uniqueFiles.map((file) => ({
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: "queued",
          progress: 0,
          error: null,
        })),
      ];
    });
  };

  const removeFromQueue = (id) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  // Add multi-select handlers
  const toggleFileSelection = (id) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const removeSelected = () => {
    setUploadQueue((prev) =>
      prev.filter((item) => !selectedFiles.has(item.id))
    );
    setSelectedFiles(new Set());
  };

  const retrySelected = () => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        selectedFiles.has(item.id) && item.status === "failed"
          ? { ...item, status: "queued", error: null }
          : item
      )
    );
  };

  const uploadFile = async (queueItem) => {
    const formData = new FormData();
    formData.append("files", queueItem.file);

    try {
      const response = await axios.post(`${server}/api/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueItem.id ? { ...item, progress } : item
            )
          );
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === queueItem.id
            ? {
                ...item,
                status: "completed",
                progress: 100,
                fileData: response.data.uploadedFiles?.[0] || {
                  url: "#",
                  filename: queueItem.file.name,
                  size: queueItem.file.size,
                },
              }
            : item
        )
      );
      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to upload file";
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === queueItem.id
            ? { ...item, status: "failed", error: errorMessage }
            : item
        )
      );
      setErrors((prev) => [
        ...prev,
        `Failed to upload ${queueItem.file.name}: ${errorMessage}`,
      ]);
      return false;
    }
  };

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    const queuedItems = uploadQueue.filter((item) => item.status === "queued");
    const availableSlots = MAX_CONCURRENT_UPLOADS - activeUploads;
    const nextBatch = queuedItems.slice(0, availableSlots);

    if (nextBatch.length === 0) {
      processingRef.current = false;
      return;
    }

    // Mark files as uploading
    setUploadQueue((prev) =>
      prev.map((item) =>
        nextBatch.some((n) => n.id === item.id)
          ? { ...item, status: "uploading" }
          : item
      )
    );

    setActiveUploads((prev) => prev + nextBatch.length);

    const uploadResults = await Promise.all(
      nextBatch.map(async (item) => {
        const success = await uploadFile(item);
        return { id: item.id, success };
      })
    );

    const upCommingUploadQueue = uploadQueue.filter(
      (item) => !nextBatch.some((n) => n.id === item.id)
    );
    setUploadQueue(upCommingUploadQueue);

    // Update active uploads
    setActiveUploads((prev) => prev - nextBatch.length);

    processingRef.current = false;

    // Re-process the queue if any were successful or still queued
    if (
      upCommingUploadQueue.some((item) => item.status === "queued") ||
      uploadResults.some((res) => !res.success)
    ) {
      //   console.log("Here is the uploaded queue", uploadQueue);
      setTimeout(() => processQueue(), 200);
    }
  }, [uploadQueue, activeUploads]);

  useEffect(() => {
    if (!processingRef.current) {
      //   console.log("Here is the uploaded queue", uploadQueue);
      processQueue();
    }
  }, [uploadQueue, activeUploads, processQueue]);

  // Filter files by status
  const uploadingFiles = uploadQueue.filter(
    (item) => item.status === "uploading"
  );
  const queuedFiles = uploadQueue.filter((item) => item.status === "queued");
  const failedFiles = uploadQueue.filter((item) => item.status === "failed");
  const completedFiles = uploadQueue.filter(
    (item) => item.status === "completed"
  );

  return (
    <div className="space-y-4">
      <Card sectioned>
        <DropZone
          onDrop={handleDrop}
          allowMultiple
          label="Drag and drop files here"
        >
          <DropZone.FileUpload />
        </DropZone>
      </Card>

      {errors.length > 0 && (
        <Banner
          title="Upload errors"
          status="critical"
          onDismiss={() => setErrors([])}
        >
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Banner>
      )}

      {selectedFiles.size > 0 && (
        <Card sectioned>
          <InlineStack align="space-between">
            <span>{selectedFiles.size} selected</span>
            <InlineStack gap="200">
              <Button onClick={retrySelected}>Retry Selected</Button>
              <Button destructive onClick={removeSelected}>
                Remove Selected
              </Button>
            </InlineStack>
          </InlineStack>
        </Card>
      )}

      <Card title="Upload Queue" sectioned>
        <BlockStack vertical spacing="loose">
          {uploadQueue.length === 0 && (
            <Banner status="info">
              <p>
                No files in queue. Drag and drop files above to start uploading.
              </p>
            </Banner>
          )}

          {[
            ...uploadingFiles,
            ...queuedFiles,
            ...failedFiles,
            ...completedFiles,
          ].map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Checkbox
                    checked={selectedFiles.has(item.id)}
                    onChange={() => toggleFileSelection(item.id)}
                  />
                  <Thumbnail source={NoteIcon} alt={item.file.name} />
                  <span
                    className={`truncate ${
                      item.status === "failed"
                        ? "text-red-600"
                        : item.status === "completed"
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    {item.file.name}
                  </span>
                  <Badge
                    status={
                      item.status === "uploading"
                        ? "attention"
                        : item.status === "queued"
                        ? "new"
                        : item.status === "failed"
                        ? "critical"
                        : "success"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <InlineStack gap="200">
                  {item.status === "failed" && (
                    <Button
                      size="slim"
                      onClick={() => {
                        setUploadQueue((prev) =>
                          prev.map((qItem) =>
                            qItem.id === item.id
                              ? { ...qItem, status: "queued", error: null }
                              : qItem
                          )
                        );
                      }}
                    >
                      Retry
                    </Button>
                  )}
                  {item.status === "completed" && item.fileData?.url && (
                    <Button
                      size="slim"
                      onClick={() => window.open(item.fileData.url, "_blank")}
                    >
                      View
                    </Button>
                  )}
                  <Button
                    icon={DeleteIcon}
                    onClick={() => removeFromQueue(item.id)}
                    plain
                  />
                </InlineStack>
              </div>
              {item.status === "uploading" && (
                <ProgressBar progress={item.progress} size="small" />
              )}
            </div>
          ))}
        </BlockStack>
      </Card>
    </div>
  );
};

export default FileUploader;
