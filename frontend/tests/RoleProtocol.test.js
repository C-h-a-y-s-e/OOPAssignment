/* @vitest-environment jsdom */
// creates virtual browser environment
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import AdminPage from "../routes/AdminPage.jsx";
import * as api from "../api.js";
import { HTTP_STATUS } from "../StatusCodes.js";
import { fetchUserDetails } from "../api.js"; // the function we will be testing

const navigate = vi.hoisted(() => vi.fn());

vi.mock("react-router", async () => {
    //mocks react router, as admin page uses useNavigate()
    const actual = await vi.importActual("react-router");
    //retrieve the actual react router, as not everything needs to be taken
    return { //the modified version of react router
            ...actual, // keep normal react router methods
            useNavigate: () => navigate, //my one
    };
});
    

// NOTES ON THE TESTING
// Describe : Groups related tests together
// it : Defines an individual test
// expect : checks whether something is as expected
// vi : mocking tools
// beforeEach : runs some code before every test


describe("Admin access control", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        // this prevents one test mock from affecting another test
        // empties the mock states
        // do this before each test
    });

    it("Users redirected to dashboard", async () => {
        //async is used as this method is asynchronous
        localStorage.setItem("authToken", "fakeToken");
        localStorage.setItem("authEmail", "test@email.com");

        vi.spyOn(api, "fetchUserDetails").mockResolvedValue({
        userId: 1,
        firstname: "John",
        surname: "Doe",
        email: "test@email.com",
        role: { name: "employee" },
        })
        //spy on the fetchUserDetails function and pretend this fake result was returned
        navigate.mockClear();
        //create a mock navigate function
    
        
        
        // render these react components belowin the test

        render(
            React.createElement(
                MemoryRouter,
                null,
                React.createElement(AdminPage),
            ),
        );

        await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith("/dashboard", { replace: true });
        });
        //check that fake navigate function was called with dashboard and replace true
    }); 
    it("Managers redirected to dashboard", async () => {
        //async is used as this method is asynchronous
        localStorage.setItem("authToken", "fakeToken");
        localStorage.setItem("authEmail", "manager@email.com");

        vi.spyOn(api, "fetchUserDetails").mockResolvedValue({
        userId: 1,
        firstname: "John",
        surname: "Doe",
        email: "test@email.com",
        role: { name: "manager" },
        })
        //spy on the fetchUserDetails function and pretend this fake result was returned
        navigate.mockClear();
        //create a mock navigate function
    
        
        
        // render these react components belowin the test

        render(
            React.createElement(
                MemoryRouter,
                null,
                React.createElement(AdminPage),
            ),
        );

        await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith("/dashboard", { replace: true });
        });
        //check that fake navigate function was called with dashboard and replace true
    }); 
    it("Admins aren't redirected to dashboard", async () => {
        //async is used as this method is asynchronous
        localStorage.setItem("authToken", "fakeToken");
        localStorage.setItem("authEmail", "admin@email.com");

        vi.spyOn(api, "fetchUserDetails").mockResolvedValue({
        userId: 1,
        firstname: "John",
        surname: "Doe",
        email: "test@email.com",
        role: { name: "admin" },
        })
        //spy on the function and pretend this fake result was returned
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: HTTP_STATUS.OK,
            json: async () => ({ data: [] }),
        });
        navigate.mockClear();
        //create a mock navigate function
    
        
        
        // render these react components belowin the test

        render(
            React.createElement(
                MemoryRouter,
                null,
                React.createElement(AdminPage),
            ),
        );

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalled();
        });
        expect(navigate).not.toHaveBeenCalledWith("/dashboard", { replace: true });
        //check that an admin is not redirected to the dashboard
    }); 
});

