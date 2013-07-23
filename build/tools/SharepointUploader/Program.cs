//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="Forerunner">
//     Copyright (C) 2013 Forerunner Software. All rights reserved.
// </copyright>
//-----------------------------------------------------------------------
namespace Forerunner.Tools.SharepointUploader
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Net;
    using Microsoft.SharePoint.Client;

    /// <summary>
    /// Program exit code.
    /// </summary>
    internal enum ExitCode
    {
        /// <summary>
        /// The program succeeded.
        /// </summary>
        Success = 0,

        /// <summary>
        /// There was a runtime error.
        /// </summary>
        RuntimeError = 1,

        /// <summary>
        /// Arguments were not valid.
        /// </summary>
        ArgumentsError = 2
    }

    /// <summary>
    /// Main Program entry point.
    /// </summary>
    internal static class Program
    {
        /// <summary>
        /// Entry point of the application.
        /// </summary>
        /// <param name="args">The arguments.</param>
        /// <returns>the program exit code.</returns>
        public static int Main(string[] args)
        {
            Arguments arguments = null;
            if (!Arguments.TryParse(args, out arguments))
            {
                Console.Error.WriteLine(Properties.Resources.Usage);
                return (int)ExitCode.ArgumentsError;
            }

            try
            {
                LiveHttpClientContext liveContext = new LiveHttpClientContext(
                    arguments.Credential);
                liveContext.Login(arguments.Site);
                ClientContext context = new ClientContext(arguments.Site);
                context.AuthenticationMode = ClientAuthenticationMode.Anonymous;
                EventHandler<WebRequestEventArgs> callback = (sender, e) =>
                    {
                        e.WebRequestExecutor.WebRequest.CookieContainer = liveContext.Cookies;
                    };

                context.ExecutingWebRequest += callback;
                context.Load(context.Web);
                context.ExecuteQuery();
                Console.WriteLine(context.Web.Title);
                Console.WriteLine(context.Web.Created);

                Folder targetFolder = EnsureTarget(context, arguments.Target);
                Console.WriteLine(targetFolder.ServerRelativeUrl);

                // Recursively upload files and folders.
                UploadFolder(
                    context, 
                    arguments.Source, 
                    targetFolder,
                    liveContext.Cookies);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.Message);
                Console.Error.WriteLine(ex.GetType().ToString());
                Console.Error.WriteLine(ex.StackTrace);
                return (int)ExitCode.RuntimeError;
            }

            return (int)ExitCode.Success;
        }

        /// <summary>
        /// Uploads the folder.
        /// </summary>
        /// <param name="context">The context.</param>
        /// <param name="sourcePath">The source path.</param>
        /// <param name="target">The target.</param>
        /// <param name="cookies">The cookies.</param>
        private static void UploadFolder(
            ClientContext context, 
            string sourcePath, 
            Folder target,
            CookieContainer cookies)
        {
            foreach (string filePath in Directory.EnumerateFiles(sourcePath))
            {
                // TODO: Find a way to use streams.
                FileCreationInformation info = new FileCreationInformation
                {
                     Overwrite = true, 
                     Url = Path.GetFileName(filePath),
                     Content = new byte[0]
                };

                Microsoft.SharePoint.Client.File file = target.Files.Add(info);
                context.Load(file);
                context.ExecuteQuery();
                FileInfo sourceFileInfo = new FileInfo(filePath);
                if (sourceFileInfo.Length > 0)
                {
                    file.CheckOut();
                    context.ExecuteQuery();
                    using (Stream fileStream = System.IO.File.Open(
                        filePath,
                        FileMode.Open,
                        FileAccess.Read))
                    {
                        SaveBinaryDirect(
                            context,
                            file.ServerRelativeUrl,
                            "text/plain",
                            cookies,
                            fileStream);
                    }

                    file.CheckIn("Upload", CheckinType.MinorCheckIn);
                    context.ExecuteQuery();
                }
            }
        }

        /// <summary>
        /// Saves the binary directly.
        /// </summary>
        /// <param name="context">The context.</param>
        /// <param name="relativeUrl">The relative URL.</param>
        /// <param name="contentType">Type of the content.</param>
        /// <param name="cookies">The cookies.</param>
        /// <param name="fileStream">The file stream.</param>
        /// <exception cref="System.InvalidOperationException">if the upload fails.</exception>
        /// <remarks>
        /// The Share point Client's File.SaveBinaryDirect has a bug in it where it doesn't pass
        /// along cookie information needed for authentication in the web request. This implementation
        /// attempts to do the same core request.
        /// </remarks>
        private static void SaveBinaryDirect(
            ClientContext context,
            string relativeUrl,
            string contentType,
            CookieContainer cookies,
            Stream fileStream)
        {
            Uri requestUri = new Uri(new Uri(context.Url), relativeUrl);
            HttpWebRequest request = (HttpWebRequest)HttpWebRequest.Create(requestUri);

            request.CookieContainer = cookies;
            request.Method = "PUT";
            request.ContentType = contentType;
            using (Stream requestStream = request.GetRequestStream())
            {
                fileStream.CopyTo(requestStream);
            }

            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            {
                string text = null;
                using (StreamReader reader = new StreamReader(response.GetResponseStream()))
                {
                    text = reader.ReadToEnd();
                }

                if (response.StatusCode != HttpStatusCode.Created &&
                    response.StatusCode != HttpStatusCode.OK &&
                    response.StatusCode != HttpStatusCode.Accepted &&
                    response.StatusCode != HttpStatusCode.NotModified)
                {
                    string message = string.Format(
                        System.Globalization.CultureInfo.CurrentCulture,
                        Properties.Resources.SaveBinaryDirect_UploadFailed,
                        relativeUrl, 
                        response.StatusCode,
                        response.StatusDescription,
                        text);
                    throw new InvalidOperationException(message);
                }
            }
        }

        /// <summary>
        /// Ensures the target folder exists.
        /// </summary>
        /// <param name="context">The context.</param>
        /// <param name="path">The path to the target.</param>
        /// <returns>the folder object.</returns>
        private static Folder EnsureTarget(ClientContext context, string path)
        {
            context.Load(context.Web.RootFolder);
            context.ExecuteQuery();

            string[] parts = path.Split('/').Select(e => e.Trim()).Where(e => e.Length > 0).ToArray();
            Folder currentFolder = context.Web.RootFolder;
            foreach (string part in parts)
            {
                context.Load(currentFolder.Folders);
                context.ExecuteQuery();
                Folder matchingFolder = currentFolder.Folders.ToArray().Where(
                    e => string.Compare(e.Name, part, StringComparison.OrdinalIgnoreCase) == 0).FirstOrDefault();
                if (matchingFolder == null)
                {
                    // create the sub folder that does not exist.
                    currentFolder = currentFolder.Folders.Add(part);
                    context.Load(currentFolder);
                    context.ExecuteQuery();
                }
                else
                {
                    currentFolder = matchingFolder;
                }
            }

            return currentFolder;
        }
    }
}
