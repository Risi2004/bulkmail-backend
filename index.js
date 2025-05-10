const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

let transporter = null;

mongoose.connect("mongodb://127.0.0.1:27017/passkey")
  .then(async () => {
    console.log("Connected to DB");

    const credential = mongoose.model("credential", {}, "bulkmail");
    const data = await credential.find();

    if (data.length === 0) {
      throw new Error("No credentials found in DB");
    }

    const { user, pass } = data[0].toJSON();

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user,
        pass: pass,
      },
    });
    console.log("Transporter ready");
  })
  .catch(err => {
    console.error("Failed to connect or setup transporter", err);
  });

app.post("/sendemail", async function (req, res) {
  if (!transporter) {
    return res.status(500).send(false);
  }

  const { msg, emailList } = req.body;

  try {
    for (let i = 0; i < emailList.length; i++) {
      await transporter.sendMail({
        from: transporter.options.auth.user,
        to: emailList[i],
        subject: "A msg from Bulk Mail App",
        text: msg,
      });
    }
    res.send(true);
  } catch (error) {
    console.error("Email sending failed:", error);
    res.send(false);
  }
});

app.listen(5000, function () {
  console.log("Server Started on http://localhost:5000");
});
