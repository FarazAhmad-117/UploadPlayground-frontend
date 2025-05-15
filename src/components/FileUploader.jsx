import { useState, useCallback, useEffect } from "react";
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
} from "@shopify/polaris";
import { NoteIcon, DeleteIcon } from "@shopify/polaris-icons";
import axios from "axios";

const server = import.meta.env.VITE_API_BASE_URL;

const FileUploader = () => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [activeUploads, setActiveUploads] = useState(0);
  const [errors, setErrors] = useState([]);
  const MAX_CONCURRENT_UPLOADS = 2;

  const handleDrop = useCallback((_droppedFiles, acceptedFiles) => {
    addToQueue(acceptedFiles);
  }, []);

  const addToQueue = (newFiles) => {
    setUploadQueue((prev) => [
      ...prev,
      ...newFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: "queued",
        progress: 0,
        error: null,
      })),
    ]);
  };

  const removeFromQueue = (id) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const uploadFile = async (queueItem) => {
    const formData = new FormData();
    formData.append("files", queueItem.file);

    try {
      const response = await axios.post(`${server}/api/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
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

      // Handle successful upload
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === queueItem.id
            ? {
                ...item,
                status: "completed",
                progress: 100,
                fileData: response.data.files[0], // Assuming single file response
              }
            : item
        )
      );
      return true;
    } catch (error) {
      // Handle upload error
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to upload file";
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
    if (activeUploads >= MAX_CONCURRENT_UPLOADS || uploadQueue.length === 0) {
      return;
    }

    const nextBatch = uploadQueue
      .filter((item) => item.status === "queued")
      .slice(0, MAX_CONCURRENT_UPLOADS - activeUploads);

    if (nextBatch.length === 0) return;

    setActiveUploads((prev) => prev + nextBatch.length);

    // Process each file in the batch
    const uploadPromises = nextBatch.map(async (item) => {
      // Update status to uploading
      setUploadQueue((prev) =>
        prev.map((qItem) =>
          qItem.id === item.id ? { ...qItem, status: "uploading" } : qItem
        )
      );

      const success = await uploadFile(item);

      setActiveUploads((prev) => prev - 1);
      if (success) {
        // Process next in queue after a small delay
        setTimeout(processQueue, 300);
      } else {
        processQueue();
      }
    });

    await Promise.all(uploadPromises);
  }, [activeUploads, uploadQueue]);

  useEffect(() => {
    processQueue();
  }, [uploadQueue, processQueue]);

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

      <Card title="Upload Queue" sectioned>
        <BlockStack vertical spacing="loose">
          {uploadQueue.length === 0 && (
            <Banner status="info">
              <p>
                No files in queue. Drag and drop files above to start uploading.
              </p>
            </Banner>
          )}

          {uploadingFiles.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Thumbnail source={NoteIcon} alt={item.file.name} />
                  <span className="truncate">{item.file.name}</span>
                  <Badge status="attention">Uploading</Badge>
                </div>
                <Button
                  icon={DeleteIcon}
                  onClick={() => removeFromQueue(item.id)}
                  plain
                />
              </div>
              <ProgressBar progress={item.progress} size="small" />
            </div>
          ))}

          {queuedFiles.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Thumbnail source={NoteIcon} alt={item.file.name} />
                <span className="truncate">{item.file.name}</span>
                <Badge status="new">Queued</Badge>
              </div>
              <Button
                icon={DeleteIcon}
                onClick={() => removeFromQueue(item.id)}
                plain
              />
            </div>
          ))}

          {failedFiles.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Thumbnail source={NoteIcon} alt={item.file.name} />
                <span className="truncate text-red-600">{item.file.name}</span>
                <Badge status="critical">Failed</Badge>
              </div>
              <InlineStack gap="200">
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
                <Button
                  icon={DeleteIcon}
                  onClick={() => removeFromQueue(item.id)}
                  plain
                />
              </InlineStack>
            </div>
          ))}

          {completedFiles.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Thumbnail source={NoteIcon} alt={item.file.name} />
                <span className="truncate text-green-600">
                  {item.file.name}
                </span>
                <Badge status="success">Completed</Badge>
              </div>
              <InlineStack gap="200">
                {item.fileData?.url && (
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
          ))}
        </BlockStack>
      </Card>
    </div>
  );
};

export default FileUploader;
