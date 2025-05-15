import { useState, useEffect } from "react";
import {
  Page,
  Card,
  DataTable,
  EmptyState,
  Button,
  Pagination,
  TextField,
  BlockStack,
  Thumbnail,
  Icon,
  Banner,
} from "@shopify/polaris";
import { SearchIcon, DeleteIcon } from "@shopify/polaris-icons";
import axios from "axios";

const server = import.meta.env.VITE_API_BASE_URL;

export function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [deleteStatus, setDeleteStatus] = useState({
    success: null,
    message: "",
  });

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { page, limit } = pagination;
      const response = await axios.get(`${server}/api/files`, {
        params: {
          page,
          limit,
          search: searchTerm,
        },
      });

      setFiles(response.data.files);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files. Please try again.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchFiles();
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`${server}/api/files/${fileId}`);
      setDeleteStatus({
        success: true,
        message: "File deleted successfully",
      });
      fetchFiles(); // Refresh the list
    } catch (err) {
      console.error("Error deleting file:", err);
      setDeleteStatus({
        success: false,
        message: "Failed to delete file",
      });
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [pagination?.page, pagination?.limit]);

  const fileTypeIcon = (fileType) => {
    if (fileType.includes("image")) return "image";
    if (fileType.includes("pdf")) return "pdf";
    if (fileType.includes("text")) return "document";
    return "document";
  };

  const rows = files?.map((file) => [
    <Stack alignment="center" key={file._id}>
      <Thumbnail
        source={fileTypeIcon(file.fileType)}
        alt={file.originalName}
        size="small"
      />
      <span>{file.originalName}</span>
    </Stack>,
    `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    file.fileType,
    new Date(file.uploadDate).toLocaleDateString(),
    <BlockStack distribution="trailing">
      <Button
        plain
        icon={DeleteIcon}
        onClick={() => handleDelete(file._id)}
        disabled={loading}
      />
      <Button
        plain
        onClick={() => window.open(file.url, "_blank")}
        disabled={loading}
      >
        View
      </Button>
    </BlockStack>,
  ]);

  return (
    <Page
      title="My Files"
      primaryAction={{
        content: "Refresh",
        onAction: fetchFiles,
        disabled: loading,
      }}
    >
      {deleteStatus.message && (
        <Banner
          status={deleteStatus.success ? "success" : "critical"}
          onDismiss={() => setDeleteStatus({ success: null, message: "" })}
        >
          {deleteStatus.message}
        </Banner>
      )}

      <Card>
        <div style={{ padding: "16px" }}>
          <BlockStack>
            <TextField
              label="Search files"
              labelHidden
              placeholder="Search by name or type..."
              value={searchTerm}
              onChange={setSearchTerm}
              prefix={<Icon source={SearchIcon} />}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              connectedRight={
                <Button onClick={handleSearch} disabled={loading}>
                  Search
                </Button>
              }
            />
          </BlockStack>
        </div>

        {error ? (
          <EmptyState
            heading="Error loading files"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>{error}</p>
            <Button onClick={fetchFiles}>Try again</Button>
          </EmptyState>
        ) : loading ? (
          <DataTable
            columnContentTypes={["text", "text", "text", "text", "text"]}
            headings={["Name", "Size", "Type", "Uploaded", "Actions"]}
            rows={[]}
            loading
          />
        ) : files?.length > 0 ? (
          <>
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "text"]}
              headings={["Name", "Size", "Type", "Uploaded", "Actions"]}
              rows={rows}
            />
            <div style={{ padding: "16px", textAlign: "center" }}>
              <Pagination
                hasPrevious={pagination.page > 1}
                onPrevious={() => handlePageChange(pagination.page - 1)}
                hasNext={pagination.page < pagination.pages}
                onNext={() => handlePageChange(pagination.page + 1)}
                label={`Showing ${files.length} of ${pagination.total} files`}
              />
            </div>
          </>
        ) : (
          <EmptyState
            heading="No files found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>No files match your search criteria.</p>
            <Button
              onClick={() => {
                setSearchTerm("");
                fetchFiles();
              }}
            >
              Clear search
            </Button>
          </EmptyState>
        )}
      </Card>
    </Page>
  );
}
