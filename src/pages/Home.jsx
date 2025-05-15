import { Page, Card, Layout, Banner, Button } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export function Home() {
  const navigate = useNavigate();

  return (
    <Page title="Dashboard" fullWidth>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Banner
              title="Welcome to Polaris File Uploader"
              status="info"
              action={{
                content: "Start Uploading",
                onAction: () => navigate("/upload"),
              }}
            >
              <p>
                Upload, manage, and organize your files with our easy-to-use
                interface.
              </p>
            </Banner>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card title="Quick Actions" sectioned>
            <div className="space-y-3">
              <Button fullWidth onClick={() => navigate("/upload")}>
                Upload Files
              </Button>
              <Button fullWidth onClick={() => navigate("/files")}>
                View My Files
              </Button>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
