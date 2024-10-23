# Hexabot Facebook/Messenger Channel Extension

Welcome to the [Hexabot](https://hexabot.ai/) Facebook/Messenger Channel Extension! This extension enables seamless integration of your Hexabot chatbot with Facebook Messenger, allowing you to engage with your audience directly on one of the world's most popular messaging platforms.

[Hexabot](https://hexabot.ai/) is an open-source chatbot / agent solution that allows users to create and manage AI-powered, multi-channel, and multilingual chatbots with ease. If you would like to learn more, please visit the [official github repo](https://github.com/Hexastack/Hexabot/).

## Features

- **User Data Retrieval**: Fetch essential user information such as first name, last name, profile picture, locale, timezone, and gender.
- **Custom Greeting**: Display a personalized greeting message to users when they first interact with your chatbot.
- **Custom Labels**: Organize and manage your chatbot's interactions using custom labels for better categorization and targeting.
- **Persistent Menu**: Provide users with a consistent navigation menu accessible at any time during the conversation.
- **Rich Messaging Features**:
  - **Buttons**: Add interactive buttons to guide user actions.
  - **Quick Replies**: Offer predefined response options for faster user interactions.
  - **Carousel (Templates)**: Display multiple items in a swipeable carousel format for enhanced user engagement.
  - **Attachments**: Send images, videos, files, and other media to enrich conversations.


## Prerequisites

Before you begin, ensure you have the following:

- A **Facebook account**.
- Basic knowledge of **APIs** and **web development** (optional but recommended).
- A **server** to host your chatbot (can be local for testing using [ngrok](https://ngrok.com/) or similar API gateway).
- **HTTPS** enabled on your server (required for webhooks).
- You have already cloned Hexabot locally (please refer to https://github.com/hexastack/hexabot)


## Installation
First, navigate to your Hexabot project directory and make sure the dependencies are installed:
```sh
cd ~/projects/Hexabot/api

npm install --save hexabot-channel-messenger

cd ../

npx hexabot dev
```

---

## Step 1: Create a Meta Developer Account

1. **Access Meta for Developers:**
   - Navigate to [Meta for Developers](https://developers.facebook.com/) in your web browser.

2. **Log In:**
   - Click on the **"Get Started"** button.
   - Log in using your Facebook credentials.

3. **Register as a Developer:**
   - If prompted, accept the **Meta Platform Policies**.
   - Complete any additional verification steps, such as providing a phone number.

4. **Access Developer Dashboard:**
   - Once registered, you'll be redirected to the **Developer Dashboard**, where you can manage your apps.

---

## Step 2: Set Up a Facebook Page

A Facebook Page is necessary for your chatbot to interact with users.

1. **Create a Page:**
   - Go to [Facebook Pages](https://www.facebook.com/pages/create/).
   - Choose a page type (e.g., Business, Community).

2. **Fill in Page Details:**
   - Provide the **Page Name**, **Category**, and other required information.
   - Click **"Create Page"**.

3. **Customize Your Page:**
   - Add a **Profile Picture** and **Cover Photo**.
   - Complete the **About** section to provide context to your users.

---

## Step 3: Create a New App in Meta Developer Dashboard

1. **Navigate to Apps:**
   - In the **Developer Dashboard**, click on **"My Apps"** in the top-right corner.

2. **Create a New App:**
   - Click on the **"Create App"** button.

3. **Select App Type:**
   - Choose **"Business"** or **"None"** based on your needs.
   - Click **"Next"**.

4. **Provide App Details:**
   - Enter an **App Name**.
   - Provide your **Contact Email**.
   - Click **"Create App"**.

5. **Verify Your Account:**
   - If prompted, complete any additional security verifications.

---

## Step 4: Configure Messenger Product

1. **Add Messenger to Your App:**
   - In your app's dashboard, click on **"Add Product"** in the sidebar.
   - Find **"Messenger"** and click **"Set Up"**.

2. **Configure Messenger Settings:**
   - Navigate to **"Messenger"** under the **Products** section in your app dashboard.
   - You'll need to connect your **Facebook Page** to the Messenger product.

---

## Step 5: Generate a Page Access Token

1. **Select Your Facebook Page:**
   - In the Messenger settings, under **"Access Tokens"**, select the **Facebook Page** you created earlier.

2. **Generate Token:**
   - Click **"Generate Token"**.
   - **Copy** the generated **Page Access Token** and store it securely. You'll need it for your chatbot's backend.

3. **Set Up Permissions:**
   - Ensure your app has the necessary **permissions** such as `pages_messaging`.

---

## Step 6: Set Up a Webhook

Webhooks allow your chatbot to receive real-time updates from Messenger.

1. **Provide Webhook URL:**
   - In the Messenger settings, scroll to **"Webhooks"** and click **"Setup Webhooks"**.

2. **Enter Callback URL and Verify Token:**
   - **Callback URL:** The endpoint on your server that will handle incoming webhook events : `https://domain.com/webhook/messenger`
   - **Verify Token:** A secret token you create to verify the webhook.

3. **Select Subscription Fields:**
   - Choose the events you want to subscribe to, such as `messages`, `messaging_postbacks`, `message_deliveries`, `message_reads`, etc.

4. **Verify and Save:**
   - Click **"Verify and Save"**. Meta will send a verification request to your callback URL. Ensure your server responds correctly to complete the setup.

---

## Configuration

To properly set up the Facebook/Messenger channel, you'll need to configure several settings. Below is a detailed explanation of each setting and how to obtain the necessary values.

### Settings

1. **User Fields to be Retrieved**
   - **Description**: Specify which user information fields you want to retrieve from Facebook.
   - **Default Value**: `first_name,last_name,profile_pic,locale,timezone,gender`
   - **Example**: `first_name,last_name,profile_pic,locale,timezone,gender`
   - **Note**: Ensure the fields are comma-separated without spaces.

2. **ID of the Facebook Application**
   - **Description**: Your Facebook App's unique identifier.
   - **Mandatory**: **Yes**, only if you intend to use Facebook Analytics.
   - **How to Obtain**:
     - Go to your [Facebook Developer Dashboard](https://developers.facebook.com/apps/).
     - Select your app and locate the **App ID**.

3. **ID of the Facebook Page**
   - **Description**: The unique identifier of the Facebook Page you want to connect with your chatbot.
   - **Mandatory**: **Yes**, only if you intend to use Facebook Analytics.
   - **How to Obtain**:
     - Navigate to your Facebook Page.
     - Click on **About** and find the **Page ID**.

4. **Greeting Text**
   - **Default Value**: `Welcome! Ready to start a conversation with our chatbot?`
   - **Description**: This text appears on the welcome screen of your bot when users interact with it for the first time.
   - **Customization**: You can modify this message to better suit your brand's voice.

5. **Disable Composer Input**
   - **Description**: Toggle to disable the input composer in Messenger, restricting users from typing freely.
   - **Options**: `Enable` / `Disable`
   - **Use Case**: Use this if you want users to interact with your bot only through predefined buttons and quick replies.

6. **Enable 'Get Started' Button**
   - **Description**: Allows you to display the 'Get Started' button, which users can click to initiate interaction with your chatbot.
   - **Options**: `Enable` / `Disable`
   - **Recommendation**: It's recommended to enable this to provide a clear entry point for users.

7. **Webhook Verification Token**
   - **Description**: A token that Facebook uses to verify your webhook URL.
   - **How to Set Up**:
     - Generate a secure token of your choice.
     - Enter this token in both your Hexabot configuration and Facebook Developer settings under **Webhook**.

8. **Facebook Page Access Token**
   - **Description**: A token that grants your application access to the Facebook Page's messaging features.
   - **How to Obtain**:
     - In your Facebook Developer Dashboard, navigate to **Tools** > **Access Token Tool**.
     - Select your Facebook Page and generate the **Page Access Token**.
     - Copy and paste this token into the Hexabot configuration.

9. **Facebook App Secret**
   - **Description**: A secret key associated with your Facebook App, used to secure communication between Facebook and your chatbot.
   - **How to Obtain**:
     - In your Facebook Developer Dashboard, select your app.
     - Go to **Settings** > **Basic** to find the **App Secret**.
     - Keep this value confidential and do not share it publicly.

## Usage

Once the extension is installed and configured, your Hexabot chatbot will be available on Facebook Messenger. Users can interact with your bot directly from your Facebook Page, enjoying features like personalized greetings, interactive buttons, and more.

### Testing Your Integration

1. **Initiate a Conversation**: Go to your Facebook Page and click on the Messenger icon to start a conversation.
2. **Verify Greeting Message**: Ensure that the greeting text appears as configured.
3. **Interact with Buttons**: Test the 'Get Started' button and any other interactive elements you've set up.
4. **Check User Data Retrieval**: Confirm that the specified user fields are being retrieved and utilized by your chatbot.



## Contributing

We welcome contributions from the community! Whether you want to report a bug, suggest new features, or submit a pull request, your input is valuable to us.

Please refer to our contribution policy first : [How to contribute to Hexabot](./CONTRIBUTING.md)

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)

Feel free to join us on [Discord](https://discord.gg/rNb9t2MFkG)

## License

This software is licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:

1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).

---

*Happy Chatbot Building!*