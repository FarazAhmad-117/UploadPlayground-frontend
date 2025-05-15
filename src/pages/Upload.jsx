import { Page } from "@shopify/polaris";
import FileUploader from "../components/FileUploader";

export function Upload() {
  return (
    <Page
      title="Upload Files"
      primaryAction={{ content: "Refresh", disabled: true }}
    >
      <FileUploader />
    </Page>
  );
}
