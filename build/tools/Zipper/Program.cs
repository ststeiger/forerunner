namespace Zipper
{
    using System;
    using System.Collections.Generic;
    using System.IO.Compression;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    /// <summary>
    /// Main Program entry point.
    /// </summary>
    internal class Program
    {
        /// <summary>
        /// Main program routine.
        /// </summary>
        /// <param name="args">the arguments.</param>
        /// <returns>program exit code.</returns>
        public static int Main(string[] args)
        {
            if (args.Length != 2)
            {
                Console.WriteLine("Usage: zipper <source dir> <output path.zip>");
                return 1;
            }

            try
            {
                ZipFile.CreateFromDirectory(args[0], args[1]);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.GetType());
                Console.Error.WriteLine(ex.Message);
                Console.Error.WriteLine(ex.StackTrace);
                return 1;
            }

            return 0;
        }
    }
}
