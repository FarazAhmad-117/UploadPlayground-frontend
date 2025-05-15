import { Page, Card, Layout, TextContainer, Text } from "@shopify/polaris";

export function About() {
  return (
    <Page title="About">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <TextContainer>
              <Text as="h1">About Polaris File Uploader</Text>
              <p>
                This application is built with React, Vite, and Shopify Polaris
                design system. It provides a user-friendly interface for
                uploading and managing files with Azure Blob Storage and MongoDB
                integration.
              </p>
              <p>Features include:</p>
              <ul>
                <li>Drag and drop file uploads</li>
                <li>Concurrent upload management</li>
                <li>File listing and management</li>
                <li>Responsive Polaris UI</li>
              </ul>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
