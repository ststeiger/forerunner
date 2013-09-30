namespace ReportMannagerConfigTool
{
    partial class frmManualActivation
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.richTxtBoxManualActivation = new System.Windows.Forms.RichTextBox();
            this.SuspendLayout();
            // 
            // richTxtBoxManualActivation
            // 
            this.richTxtBoxManualActivation.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.richTxtBoxManualActivation.Location = new System.Drawing.Point(13, 13);
            this.richTxtBoxManualActivation.Name = "richTxtBoxManualActivation";
            this.richTxtBoxManualActivation.Size = new System.Drawing.Size(727, 655);
            this.richTxtBoxManualActivation.TabIndex = 0;
            this.richTxtBoxManualActivation.Text = "\n\n \n";
            this.richTxtBoxManualActivation.TextChanged += new System.EventHandler(this.richTxtBoxManualActivation_TextChanged);
            // 
            // frmManualActivation
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(752, 680);
            this.Controls.Add(this.richTxtBoxManualActivation);
            this.Name = "frmManualActivation";
            this.Text = "frmManualActivation";
            this.Load += new System.EventHandler(this.frmManualActivation_Load);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.RichTextBox richTxtBoxManualActivation;

    }
}