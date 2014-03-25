//-----------------------------------------------------------------------
// <copyright file="Check.cs" company="Jon Rowlett">
//     Copyright (C) 2004-2010 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
namespace Common
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Text;
    using System.Text.RegularExpressions;
    using Diagnostics;

    /// <summary>
    /// Used to specify either a lower or upper bound in a range.
    /// </summary>
    /// <typeparam name="T">Any IComparable type</typeparam>
    public struct Bound<T> : IEquatable<Bound<T>> where T : IComparable<T>
    {
        #region Fields

        /// <summary>
        /// the value of the bound
        /// </summary>
        private T value;

        /// <summary>
        /// true if the value is included in the bound.
        /// </summary>
        private bool inclusive;

        #endregion Fields

        #region Constructors

        /// <summary>
        /// Initializes a new instance of the Bound struct.
        /// </summary>
        /// <param name="value">the value of the bound</param>
        /// <param name="inclusive">true if the value is inclusive to the bound</param>
        public Bound(T value, bool inclusive)
        {
            this.value = value;
            this.inclusive = inclusive;
        }

        /// <summary>
        /// Initializes a new instance of the Bound struct.
        /// initializes an inclusive bounds.
        /// </summary>
        /// <param name="value">the value of the bound</param>
        public Bound(T value)
            : this(value, true)
        {
        }

        #endregion Constructors

        #region Properties

        /// <summary>
        /// Gets the value of the bounds
        /// </summary>
        public T Value
        {
            get
            {
                return this.value;
            }
        }

        /// <summary>
        /// Gets a value indicating whether the Value is included in the bound
        /// </summary>
        public bool Inclusive
        {
            get
            {
                return this.inclusive;
            }
        }

        #endregion Properties

        #region Operators

        /// <summary>
        /// compares 2 bounds for equality
        /// </summary>
        /// <param name="leftOperand">the left operand</param>
        /// <param name="rightOperand">the right operand</param>
        /// <returns>true if both bounds are equal</returns>
        public static bool operator ==(Bound<T> leftOperand, Bound<T> rightOperand)
        {
            return leftOperand.Equals(rightOperand);
        }

        /// <summary>
        /// compares 2 bounds for inequality
        /// </summary>
        /// <param name="leftOperand">the left operand</param>
        /// <param name="rightOperand">the right operand</param>
        /// <returns>true if both bound are not equal</returns>
        public static bool operator !=(Bound<T> leftOperand, Bound<T> rightOperand)
        {
            return !leftOperand.Equals(rightOperand);
        }

        #endregion Operators

        #region Methods

        /// <summary>
        /// Gets the hash code of the object
        /// </summary>
        /// <returns>the integer hash code</returns>
        public override int GetHashCode()
        {
            return this.value.GetHashCode() ^ this.inclusive.GetHashCode();
        }

        /// <summary>
        /// compares 2 instances of any object for equality
        /// </summary>
        /// <param name="obj">object to compare</param>
        /// <returns>true if both objects are equal</returns>
        public override bool Equals(object obj)
        {
            if (obj == null || !(obj is Bound<T>))
            {
                return false;
            }

            return this.Equals((Bound<T>)obj);
        }

        /// <summary>
        /// Compares fields of another bound for equality.
        /// </summary>
        /// <param name="other">the other object to compare</param>
        /// <returns>true if both objects are equal</returns>
        public bool Equals(Bound<T> other)
        {
            return this.inclusive == other.inclusive && Comparer<T>.Default.Compare(this.value, other.value) == 0;
        }

        #endregion Methods
    }

    /// <summary>
    /// Used to describe a range of values.
    /// </summary>
    /// <typeparam name="T">Any IComparable type</typeparam>
    public struct Range<T> : IEquatable<Range<T>> where T : IComparable<T>
    {
        #region Fields

        /// <summary>
        /// The lower bounds
        /// </summary>
        private Bound<T> lowerBound;

        /// <summary>
        /// The upper bounds
        /// </summary>
        private Bound<T> upperBound;

        #endregion Fields

        #region Constructors

        /// <summary>
        /// Initializes a new instance of the Range struct.
        /// </summary>
        /// <param name="lowerBound">The lower bound</param>
        /// <param name="upperBound">the upper bound</param>
        public Range(Bound<T> lowerBound, Bound<T> upperBound)
            : this()
        {
            Check.IsGreaterThanOrEqual(
                upperBound.Value, 
                lowerBound.Value, 
                "lowerBound", 
                Internal.Tracing.Source);
            this.lowerBound = lowerBound;
            this.upperBound = upperBound;
        }

        /// <summary>
        /// Initializes a new instance of the Range struct.
        /// </summary>
        /// <param name="lowerBound">the lower bounds</param>
        /// <param name="upperBound">the upper bounds</param>
        public Range(T lowerBound, T upperBound)
            : this(new Bound<T>(lowerBound), new Bound<T>(upperBound))
        {
        }

        #endregion Constructors

        #region Properties

        /// <summary>
        /// Gets the lower bound
        /// </summary>
        public Bound<T> LowerBound
        {
            get
            {
                return this.lowerBound;
            }
        }

        /// <summary>
        /// Gets the upper bound
        /// </summary>
        public Bound<T> UpperBound
        {
            get
            {
                return this.upperBound;
            }
        }

        #endregion Properties

        #region Operators

        /// <summary>
        /// Compares 2 ranges for equality
        /// </summary>
        /// <param name="leftOperand">the left operand</param>
        /// <param name="rightOperand">the right operand</param>
        /// <returns>true if both ranges are equal</returns>
        public static bool operator ==(Range<T> leftOperand, Range<T> rightOperand)
        {
            return leftOperand.Equals(rightOperand);
        }

        /// <summary>
        /// Compares 2 ranges for inequality
        /// </summary>
        /// <param name="leftOperand">the left operand</param>
        /// <param name="rightOperand">the right operand</param>
        /// <returns>true if both ranges are not equal</returns>
        public static bool operator !=(Range<T> leftOperand, Range<T> rightOperand)
        {
            return !leftOperand.Equals(rightOperand);
        }

        #endregion Operators

        #region Methods

        /// <summary>
        /// Gets the hash code for the range.
        /// </summary>
        /// <returns>a hash code for the range</returns>
        public override int GetHashCode()
        {
            return this.lowerBound.GetHashCode() ^ this.upperBound.GetHashCode();
        }

        /// <summary>
        /// Compares this range against any object
        /// </summary>
        /// <param name="obj">another range or object to compare against</param>
        /// <returns>true if the object is a range and is an equivalent range</returns>
        public override bool Equals(object obj)
        {
            if (obj == null || !(obj is Range<T>))
            {
                return false;
            }

            return this.Equals((Range<T>)obj);
        }

        /// <summary>
        /// compares against another range for equality
        /// </summary>
        /// <param name="other">the other range</param>
        /// <returns>true if both ranges are the same</returns>
        public bool Equals(Range<T> other)
        {
            return this.lowerBound.Equals(other.lowerBound) && this.upperBound.Equals(other.upperBound);
        }

        /// <summary>
        /// Tests if a value is contained within the range.
        /// </summary>
        /// <param name="value">the value to test</param>
        /// <returns>true if the value is in the range</returns>
        public bool Contains(T value)
        {
            int lowCompare = value.CompareTo(this.LowerBound.Value);
            int highCompare = value.CompareTo(this.UpperBound.Value);
            bool passLow = lowCompare > 0 || (lowCompare == 0 && this.LowerBound.Inclusive);
            bool passHigh = highCompare < 0 || (highCompare == 0 && this.UpperBound.Inclusive);
            return passLow && passHigh;
        }

        #endregion Methods
    }

    /// <summary>
    /// checks constraints and throws good exceptions.
    /// </summary>
    public static class Check
    {
        /// <summary>
        /// Checks that a parameter is not null. throws ArgumentNullException.
        /// </summary>
        /// <typeparam name="T">Any reference type</typeparam>
        /// <param name="value">value to check.</param>
        /// <param name="parameterName">name of the parameter</param>
        /// <param name="source">trace source for tracing the exception</param>
        /// <returns>the value if it is not null</returns>
        public static T IsNotNull<T>(T value, string parameterName, TraceSource source) where T : class
        {
            if (value == null)
            {
                throw TraceUtility.TraceThrowException(
                    source,
                    new ArgumentNullException(parameterName),
                    TraceEventType.Error);
            }

            return value;
        }

        /// <summary>
        /// Throws ArgumentException if the value passed in is null or empty.
        /// Otherwise returns the value.
        /// </summary>
        /// <param name="value">the string to check</param>
        /// <param name="parameterName">the name of the parameter</param>
        /// <param name="source">trace source for tracing the exception</param>
        /// <returns>the original string if valid</returns>
        public static string IsNotNullOrEmpty(string value, string parameterName, TraceSource source)
        {
            if (String.IsNullOrEmpty(value))
            {
                ArgumentException ex = new ArgumentException(
                    Properties.Resources.Check_IsNotNullOrEmptyMessage,
                    parameterName);
                throw TraceUtility.TraceThrowException(
                    source,
                    ex,
                    TraceEventType.Error);
            }

            return value;
        }

        /// <summary>
        /// matches against a regular expression.
        /// </summary>
        /// <param name="value">the string to check</param>
        /// <param name="pattern">the pattern to match</param>
        /// <param name="parameterName">the name of the parameter</param>
        /// <param name="source">the trace source used to trace the exception</param>
        /// <returns>the original string if there is a match of the string in the pattern</returns>
        public static string IsMatch(string value, Regex pattern, string parameterName, TraceSource source)
        {
            if (!pattern.IsMatch(Check.IsNotNull(value, parameterName, source)))
            {
                ArgumentException ex = new ArgumentException(
                    string.Format(
                        System.Globalization.CultureInfo.CurrentUICulture,
                        Properties.Resources.Check_IsMatchMessage,
                        pattern),
                    parameterName);
                throw TraceUtility.TraceThrowException(
                    source,
                    ex,
                    TraceEventType.Error);
            }

            return value;
        }

        /// <summary>
        /// checks that the value is strictly greater than the lower bound
        /// </summary>
        /// <typeparam name="T">Any IComparable type</typeparam>
        /// <param name="value">the value to check</param>
        /// <param name="lowerBound">the lower bound of valid values</param>
        /// <param name="parameterName">the name of the parameter</param>
        /// <param name="source">the trace source used to trace the exception</param>
        /// <returns>the value if it is valid</returns>
        public static T IsGreaterThan<T>(T value, T lowerBound, string parameterName, TraceSource source) where T : IComparable<T>
        {
            if (value.CompareTo(lowerBound) <= 0)
            {
                throw TraceUtility.TraceThrowException(
                    source,
                    new ArgumentOutOfRangeException(parameterName),
                    TraceEventType.Error);
            }

            return value;
        }

        /// <summary>
        /// Checks that the value is greater than or equal to the lowerBound.
        /// </summary>
        /// <typeparam name="T">Any IComparable type.</typeparam>
        /// <param name="value">the value to check</param>
        /// <param name="lowerBound">the lower bound of valid values</param>
        /// <param name="parameterName">the name of the parameter</param>
        /// <param name="source">trace source used to trace the exception</param>
        /// <returns>the value if it is valid</returns>
        public static T IsGreaterThanOrEqual<T>(T value, T lowerBound, string parameterName, TraceSource source) where T : IComparable<T>
        {
            if (value.CompareTo(lowerBound) < 0)
            {
                throw TraceUtility.TraceThrowException(
                    source,
                    new ArgumentOutOfRangeException(parameterName),
                    TraceEventType.Error);
            }

            return value;
        }

        /// <summary>
        /// reject input that is in a set.
        /// </summary>
        /// <typeparam name="T">any value type</typeparam>
        /// <param name="value">the value to check</param>
        /// <param name="parameterName">the name of the parameter</param>
        /// <param name="source">the trace source used to trace the exception</param>
        /// <param name="excludedSet">the set of values that are not valid</param>
        /// <returns>the value if it is not in the excluded set</returns>
        public static T IsNotInSet<T>(T value, string parameterName, TraceSource source, params T[] excludedSet) where T : struct
        {
            foreach (T excludedValue in excludedSet)
            {
                if (excludedValue.Equals(value))
                {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < excludedSet.Length; i++)
                    {
                        if (i > 0)
                        {
                            sb.Append(Properties.Resources.Check_IsNotInSetDelimiter);
                        }

                        sb.Append(excludedSet[i].ToString());
                    }

                    string message = String.Format(
                        System.Globalization.CultureInfo.CurrentUICulture,
                        Properties.Resources.Check_IsNotInSetMessage,
                        sb.ToString());
                    ArgumentOutOfRangeException ex = new ArgumentOutOfRangeException(
                        parameterName,
                        value,
                        message);
                    throw TraceUtility.TraceThrowException(
                        source,
                        ex,
                        TraceEventType.Error);
                }
            }

            return value;
        }

        /// <summary>
        /// checks the value is in a range.
        /// </summary>
        /// <typeparam name="T">Any IComparable type</typeparam>
        /// <param name="value">the value to check</param>
        /// <param name="parameterName">the name of the parameter</param>
        /// <param name="source">trace source to use for the exception</param>
        /// <param name="range">the range to check against</param>
        /// <returns>the value if it is in the range</returns>
        public static T IsInRange<T>(T value, string parameterName, TraceSource source, Range<T> range) where T : IComparable<T>
        {
            return IsInRange<T>(value, parameterName, source, range.LowerBound, range.UpperBound);
        }

        /// <summary>
        /// checks the value is in a range
        /// </summary>
        /// <typeparam name="T">any IComparable type</typeparam>
        /// <param name="value">the value to check</param>
        /// <param name="parameterName">the name of the parameter</param>
        /// <param name="source">trace source used to trace the exception</param>
        /// <param name="lowerBound">the lower bound to check against</param>
        /// <param name="upperBound">the upper bound to check against</param>
        /// <returns>the value if it is in the range</returns>
        public static T IsInRange<T>(T value, string parameterName, TraceSource source, Bound<T> lowerBound, Bound<T> upperBound) where T : IComparable<T>
        {
            int lowerBoundResult = value.CompareTo(lowerBound.Value);
            if (lowerBoundResult > 0 || (lowerBound.Inclusive && lowerBoundResult == 0))
            {
                int upperBoundResult = value.CompareTo(upperBound.Value);
                if (upperBoundResult < 0 || (upperBound.Inclusive && upperBoundResult == 0))
                {
                    return value;
                }
            }

            string messageFormat = lowerBound.Inclusive ?
                (upperBound.Inclusive ?
                    Properties.Resources.Check_InRangeMessageInclusiveInclusive :
                    Properties.Resources.Check_InRangeMessageInclusiveExclusive) :
                (upperBound.Inclusive ?
                    Properties.Resources.Check_InRangeMessageExclusiveInclusive :
                    Properties.Resources.Check_InRangeMessageExclusiveExclusive);
            string message = string.Format(
                System.Globalization.CultureInfo.CurrentUICulture,
                messageFormat,
                lowerBound.Value,
                upperBound.Value);
            ArgumentOutOfRangeException ex = new ArgumentOutOfRangeException(
                parameterName,
                value,
                message);
            throw TraceUtility.TraceThrowException(
                source,
                ex,
                TraceEventType.Error);
        }
    }
}
