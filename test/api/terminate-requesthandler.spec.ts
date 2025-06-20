import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import Scorm2004API from "../../src/Scorm2004API";
import { global_constants } from "../../src/constants/api_constants";

describe("Terminate requestHandler Integration", () => {
  let api: Scorm2004API;
  let fetchStub: any;
  let sendBeaconStub: any;

  beforeEach(() => {
    // Mock fetch
    fetchStub = vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ result: global_constants.SCORM_TRUE, errorCode: 0 }), {
          status: 200,
        }),
      ),
    );

    // Mock navigator.sendBeacon if it doesn't exist (Node.js environment)
    if (typeof navigator === "undefined") {
      // @ts-ignore
      global.navigator = { sendBeacon: vi.fn(() => true) };
    } else if (!navigator.sendBeacon) {
      navigator.sendBeacon = vi.fn(() => true);
    }
    sendBeaconStub = vi.spyOn(navigator, "sendBeacon").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should apply requestHandler during terminate with normal fetch", async () => {
    let requestHandlerCalled = false;
    let transformedData: any = null;

    api = new Scorm2004API({
      lmsCommitUrl: "https://lms.example.com/commit",
      requestHandler: (data: any) => {
        requestHandlerCalled = true;
        // Transform the data by adding a custom field
        const transformed = JSON.parse(JSON.stringify(data));
        transformed.customField = "addedByRequestHandler";
        transformedData = transformed;
        return transformed;
      },
    });

    // Initialize the API
    api.lmsInitialize();

    // Set some data
    api.lmsSetValue("cmi.completion_status", "completed");

    // Terminate the API (this should trigger the requestHandler)
    const result = await api.terminate("Terminate", true);

    expect(result).toBe(global_constants.SCORM_TRUE);
    expect(requestHandlerCalled).toBe(true);

    // Check that fetch was called with the transformed data
    expect(fetchStub).toHaveBeenCalledOnce();
    const fetchCallBody = (fetchStub.mock.calls[0][1] as any).body;
    const sentData = JSON.parse(fetchCallBody);
    expect(sentData.customField).toBe("addedByRequestHandler");
  });

  it("should apply requestHandler during terminate with sendBeacon", async () => {
    let requestHandlerCalled = false;

    api = new Scorm2004API({
      lmsCommitUrl: "https://lms.example.com/commit",
      useBeaconInsteadOfFetch: "on-terminate",
      requestHandler: (data: any) => {
        requestHandlerCalled = true;
        // Transform the data by adding a custom field
        const transformed = JSON.parse(JSON.stringify(data));
        transformed.customField = "addedByRequestHandler";
        return transformed;
      },
    });

    // Initialize the API
    api.lmsInitialize();

    // Set some data
    api.lmsSetValue("cmi.completion_status", "completed");

    // Terminate the API (this should trigger the requestHandler)
    const result = await api.terminate("Terminate", true);

    expect(result).toBe(global_constants.SCORM_TRUE);
    expect(requestHandlerCalled).toBe(true);

    // Check that sendBeacon was called and fetch was not
    expect(sendBeaconStub).toHaveBeenCalledOnce();
    expect(fetchStub).not.toHaveBeenCalled();

    // Verify the beacon was called with correct URL and a Blob
    const [url, blob] = sendBeaconStub.mock.calls[0];
    expect(url).toBe("https://lms.example.com/commit");
    expect(blob).toBeInstanceOf(Blob);
  });

  it("should apply requestHandler during regular commit (not just terminate)", async () => {
    let requestHandlerCalled = false;

    api = new Scorm2004API({
      lmsCommitUrl: "https://lms.example.com/commit",
      requestHandler: (data: any) => {
        requestHandlerCalled = true;
        return data;
      },
    });

    // Initialize the API
    api.lmsInitialize();

    // Set some data
    api.lmsSetValue("cmi.completion_status", "completed");

    // Commit the data (regular commit, not terminate)
    const result = await api.lmsCommit();

    expect(result).toBe(global_constants.SCORM_TRUE);
    expect(requestHandlerCalled).toBe(true);
    expect(fetchStub).toHaveBeenCalledOnce();
  });
});