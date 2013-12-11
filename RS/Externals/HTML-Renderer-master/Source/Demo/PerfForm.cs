// "Therefore those skilled at the unorthodox
// are infinite as heaven and earth,
// inexhaustible as the great rivers.
// When they come to an end,
// they begin again,
// like the days and months;
// they die and are reborn,
// like the four seasons."
// 
// - Sun Tsu,
// "The Art of War"

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using System.Reflection;
using System.IO;
using HtmlRenderer.Demo.Properties;

namespace HtmlRenderer.Demo
{
    public partial class PerfForm : Form
    {
        #region Fields and Consts

        /// <summary>
        /// the html samples to show in the demo
        /// </summary>
        private readonly Dictionary<string, string> _samples = new Dictionary<string, string>();

        /// <summary>
        /// the HTML samples to run on
        /// </summary>
        private static readonly List<string> _perfTestSamples = new List<string>();

        #endregion


        /// <summary>
        /// Init.
        /// </summary>
        public PerfForm()
        {
            InitializeComponent();

            Icon = Resources.html;

            StartPosition = FormStartPosition.CenterScreen;
            Size = new Size(1200, 800);

            LoadSamples();
        }


        /// <summary>
        /// Used to execute performance test run for memory profiler so the form is not loaded, 
        /// only html container is working.
        /// </summary>
        public static void Run()
        {
            try
            {
                const int iterations = 3;
                const bool Layout = false;
                const bool Paint = false;

                LoadRunSamples();

                var htmlContainer = new HtmlContainer();
                htmlContainer.MaxSize = new SizeF(800, 0);

                GC.Collect();
                Thread.Sleep(3000);

                using (var img = new Bitmap(1, 1))
                using (var g = Graphics.FromImage(img))
                {
                    for (int i = 0; i < iterations; i++)
                    {
                        foreach (var html in _perfTestSamples)
                        {
                            htmlContainer.SetHtml(html);

                            if (Layout)
                                htmlContainer.PerformLayout(g);

                            if (Paint)
                                htmlContainer.PerformPaint(g);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.ToString(), "Error");
            }
        }


        #region Private methods

        /// <summary>
        /// Loads the tree of document samples
        /// </summary>
        private static void LoadRunSamples()
        {
            var names = Assembly.GetExecutingAssembly().GetManifestResourceNames();
            Array.Sort(names);
            foreach (string name in names)
            {
                int extPos = name.LastIndexOf('.');
                string ext = name.Substring(extPos >= 0 ? extPos : 0);

                if (".htm".IndexOf(ext, StringComparison.Ordinal) >= 0)
                {
                    var resourceStream = Assembly.GetExecutingAssembly().GetManifestResourceStream(name);
                    if (resourceStream != null)
                    {
                        using (var sreader = new StreamReader(resourceStream, Encoding.Default))
                        {
                            var html = sreader.ReadToEnd();
                            _perfTestSamples.Add(html);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Loads the tree of document samples
        /// </summary>
        private void LoadSamples()
        {
            var root = new TreeNode("HTML Renderer");
            _samplesTreeView.Nodes.Add(root);
            
            var names = Assembly.GetExecutingAssembly().GetManifestResourceNames();
            Array.Sort(names);
            foreach (string name in names)
            {
                int extPos = name.LastIndexOf('.');
                int namePos = extPos > 0 && name.Length > 1 ? name.LastIndexOf('.', extPos - 1) : 0;
                string ext = name.Substring(extPos >= 0 ? extPos : 0);
                string shortName = namePos > 0 && name.Length > 2 ? name.Substring(namePos + 1, name.Length - namePos - ext.Length - 1) : name;

                if (".htm".IndexOf(ext, StringComparison.Ordinal) >= 0)
                {
                    if (name.IndexOf("PerfSamples", StringComparison.OrdinalIgnoreCase) > -1)
                    {
                        var resourceStream = Assembly.GetExecutingAssembly().GetManifestResourceStream(name);
                        if (resourceStream != null)
                        {
                            using (var sreader = new StreamReader(resourceStream, Encoding.Default))
                            {
                                _samples[name] = sreader.ReadToEnd();
                            }

                            string nameWithSzie = string.Format("{0} ({1:N0} KB)", shortName, _samples[name].Length*2/1024);
                            var node = new TreeNode(nameWithSzie);
                            root.Nodes.Add(node);
                            node.Tag = name;
                        }
                    }
                }
            }
           
            root.Expand();
        }

        /// <summary>
        /// On tree view node click load the html to the html panel and html editor.
        /// </summary>
        private void OnSamplesTreeViewAfterSelect(object sender, TreeViewEventArgs e)
        {
            var name = e.Node.Tag as string;
            if (!string.IsNullOrEmpty(name))
            {
                _htmlPanel.Text = _samples[name];
            }
        }

        /// <summary>
        /// Clear the html in the renderer
        /// </summary>
        private void OnClearLinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            _samplesTreeView.SelectedNode = null;
            _htmlPanel.Text = null;
            GC.Collect();
        }
        
        /// <summary>
        /// Execute performance test by setting all sample htmls in a loop.
        /// </summary>
        private void OnRunTestButtonClick(object sender, EventArgs e)
        {
            if (_samplesTreeView.SelectedNode != null && _samplesTreeView.SelectedNode.Tag != null)
            {
                _runTestButton.Text = "Running..";
                _runTestButton.Enabled = false;
                Application.DoEvents();

                var iterations = (float)_iterations.Value;
                var html = _samples[(string)_samplesTreeView.SelectedNode.Tag];
                
                GC.Collect();
                AppDomain.MonitoringIsEnabled = true;
                var startMemory = AppDomain.CurrentDomain.MonitoringTotalAllocatedMemorySize;

                var sw = Stopwatch.StartNew();

                for (int i = 0; i < _iterations.Value; i++)
                {
                    _htmlPanel.Text = html;
                    Application.DoEvents(); // so paint will be called
                }

                sw.Stop();


                var endMemory = AppDomain.CurrentDomain.MonitoringTotalAllocatedMemorySize;
                var totalMem = (endMemory - startMemory) / 1024f;
                float htmlSize = html.Length*2/1024f;

                var msg = string.Format("1 HTML ({0:N0} KB)\r\n{1} Iterations", htmlSize, _iterations.Value);
                msg += "\r\n\r\n";
                msg += string.Format("CPU:\r\nTotal: {0} msec\r\nIterationAvg: {1:N2} msec",
                                        sw.ElapsedMilliseconds, sw.ElapsedMilliseconds / iterations);
                msg += "\r\n\r\n";
                msg += string.Format("Memory:\r\nTotal: {0:N0} KB\r\nIterationAvg: {1:N0} KB\r\nOverhead: {2:N0}%",
                                     totalMem, totalMem / iterations, 100 * (totalMem / iterations) / htmlSize);

                Clipboard.SetDataObject(msg);
                MessageBox.Show(msg, "Test run results");

                _runTestButton.Text = "Run Tests";
                _runTestButton.Enabled = true;
            }
        }

        #endregion
    }
}