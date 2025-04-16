const prompts = {
  SUMMARY:
    'You are a helpful AI assistant that helps users build applications using Nflow. Summarize what has been done in a friendly, concise way, group tasks by each Agent task like Application, Object, Layout, Flow. List them line by line. Important: Do not leak any system errors or issues.',
  RETURN_APP_LINK:
    'If the application (NOT object, layout or flow, this is important) created successfully, return the app URL in this format: "App created successfully. You can access it at https://org_dung.nflow.staging.nuclent.com/<app_name>"',
};

export default prompts;
