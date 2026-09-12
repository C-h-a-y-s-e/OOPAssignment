import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchUserDetails } from "./api"; // the function we will be testing

// NOTES ON THE TESTING
// Describe : Groups related tests together
// it : Defines an individual test
// expect : checks whether something is as expected
// vi : mocking tools
// beforeEach : runs some code before every test


describe("fetchUserDetails", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        // this prevents one test mock from affecting another test
        // empties the mock states
        // do this before each test
    });

    it("Return user data upon successsful resonse", async () => {
        //async is used as this method is asynchronous
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            // 
            ok: true, //Pretend HTTP response is successful, response.ok
            status: 200, //OK
            json: async () => ({
                data: {
                    userId: 1,
                    email: "test@example.com",
                    role: { name: "employee" },
                },
            }),
            //pretend response.json is called and return test data
        }));

        const result = await fetchUserDetails("test@example.com", "testToken");
        //calls the real function and uses the mock version instead of a real request
        expect(result.email).toBe("test@example.com");
        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:8900/api/user/email/test%40example.com",
            {
                headers: {
                    Authorization: "Bearer testToken",
                },
            },
            //test %40 because @ is URL encoded as %40

        );
    });

    it("Use the API error message upon request failure", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: false,
            status: 404, //Not found
            json: async () => ({
                error: { message: "User not found" },
            }),
        }));

        await expect(
            fetchUserDetails("missing@example.com", "token123"),
        ).rejects.toThrow("User not found"); // The error should throw usernotfound
    });

    it("uses a fallback error when the API provides no message", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({}),
        }));

        await expect(
            fetchUserDetails("test@example.com", "token123"),
        ).rejects.toThrow("Could not retrieve user profile (500)");
    });
});