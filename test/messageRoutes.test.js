const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const supertest = require("supertest");
const app = require("../index"); // Your Express app
const Message = require("../models/Message");
const logger = require("../logger");

describe("Message Routes", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("POST /messages", () => {
    it("should create a new message", async () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZWRmNzBlYjFhYTE2OGI4NThiYjVkYSIsImlhdCI6MTc0NDc3Mzc3MSwiZXhwIjoxNzQ0Nzc3MzcxfQ.Gn8GLgdLoPnxbrDSnX_iMhpRoKo8m3nE-DC_dmYBSyA"; // Replace with a valid token or mock JWT
      const res = await supertest(app)
        .post("/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Test Message" });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("text", "Test Message");
      expect(res.body).to.have.property("user");
    });

    it("should handle validation error", async () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZWRmNzBlYjFhYTE2OGI4NThiYjVkYSIsImlhdCI6MTc0NDc3Mzc3MSwiZXhwIjoxNzQ0Nzc3MzcxfQ.Gn8GLgdLoPnxbrDSnX_iMhpRoKo8m3nE-DC_dmYBSyA"; // Replace with a valid token
      const res = await supertest(app)
        .post("/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).to.equal(400); // Assuming 400 for validation errors
      expect(res.body.error).to.have.property("name", "ValidationError");
    });
  });

  describe("POST /messages/upload", () => {
    it("should upload a file to S3", async () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZWRmNzBlYjFhYTE2OGI4NThiYjVkYSIsImlhdCI6MTc0NDc3Mzc3MSwiZXhwIjoxNzQ0Nzc3MzcxfQ.Gn8GLgdLoPnxbrDSnX_iMhpRoKo8m3nE-DC_dmYBSyA"; // Replace with a valid token
      const res = await supertest(app)
        .post("/messages/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("test file content"), {
          filename: "test.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property(
        "message",
        "File uploaded successfully"
      );
      expect(res.body).to.have.property("fileUrl").that.is.a("string");
    });

    it("should handle upload failure", async () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZWRmNzBlYjFhYTE2OGI4NThiYjVkYSIsImlhdCI6MTc0NDc3Mzc3MSwiZXhwIjoxNzQ0Nzc3MzcxfQ.Gn8GLgdLoPnxbrDSnX_iMhpRoKo8m3nE-DC_dmYBSyA"; // Replace with a valid token
      const res = await supertest(app)
        .post("/messages/upload")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).to.equal(400); // Assuming 400 for no file
      expect(res.body.error).to.have.property("name", "ValidationError");
    });
  });
});
