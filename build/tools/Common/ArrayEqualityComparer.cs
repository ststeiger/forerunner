//-----------------------------------------------------------------------
// <copyright file="ArrayEqualityComparer.cs" company="Jon Rowlett">
//     Copyright (C) 2010 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
namespace Common
{
    using System;
    using System.Collections.Generic;
    using System.Text;

    /// <summary>
    /// Compares each element of 2 arrays for equality.
    /// </summary>
    /// <typeparam name="T">type to compare.</typeparam>
    public class ArrayEqualityComparer<T> : EqualityComparer<T[]> where T : IEquatable<T>
    {
        /// <summary>
        /// The default instance.
        /// </summary>
        private static ArrayEqualityComparer<T> defaultInstance = new ArrayEqualityComparer<T>();

        /// <summary>
        /// Gets the default instance.
        /// </summary>
        public static new ArrayEqualityComparer<T> Default
        {
            get
            {
                return defaultInstance;
            }
        }

        /// <summary>
        /// Compares two arrays.
        /// </summary>
        /// <param name="x">the first array</param>
        /// <param name="y">the second array</param>
        /// <returns>true if both arrays contain the same elements</returns>
        public override bool Equals(T[] x, T[] y)
        {
            if (x == null)
            {
                x = new T[] { };
            }

            if (y == null)
            {
                y = new T[] { };
            }

            if (x.Length != y.Length)
            {
                return false;
            }

            for (int i = 0; i < x.Length; i++)
            {
                if (!EqualityComparer<T>.Default.Equals(x[i], y[i]))
                {
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Gets the hash code for an array.
        /// </summary>
        /// <param name="obj">the array to process</param>
        /// <returns>the hash code</returns>
        public override int GetHashCode(T[] obj)
        {
            if (obj == null)
            {
                return 0;
            }

            int hash = 0;
            foreach (T element in obj)
            {
                hash ^= EqualityComparer<T>.Default.GetHashCode(element);
            }

            return hash;
        }
    }
}
