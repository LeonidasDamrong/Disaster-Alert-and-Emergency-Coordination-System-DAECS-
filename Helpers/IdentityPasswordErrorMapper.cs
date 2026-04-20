using Microsoft.AspNetCore.Identity;

namespace FYP_Project_II.Helpers
{
    /// <summary>
    /// Maps <see cref="IdentityError"/> codes to clear messages aligned with <see cref="IdentityOptions.Password"/>.
    /// </summary>
    public static class IdentityPasswordErrorMapper
    {
        public static string Map(IdentityError error, IdentityOptions identityOptions)
        {
            var minLen = identityOptions.Password.RequiredLength;
            return error.Code switch
            {
                "PasswordTooShort" =>
                    $"Password must be at least {minLen} characters long.",
                "PasswordRequiresDigit" =>
                    "Password must contain at least one number (0–9).",
                "PasswordRequiresLower" =>
                    "Password must contain at least one lowercase letter (a–z).",
                "PasswordRequiresUpper" =>
                    "Password must contain at least one uppercase letter (A–Z).",
                "PasswordRequiresNonAlphanumeric" =>
                    "Password must contain at least one special character (for example !, @, #, or $).",
                "PasswordMismatch" =>
                    "The current password you entered is incorrect.",
                _ => string.IsNullOrWhiteSpace(error.Description)
                    ? "Password validation failed."
                    : error.Description
            };
        }

        /// <summary>
        /// Builds a response payload for API clients: a short summary plus a distinct list of specific issues.
        /// </summary>
        public static (string Message, string[] Errors) ToMessageAndList(
            IEnumerable<IdentityError> errors,
            IdentityOptions identityOptions)
        {
            var list = errors
                .Select(e => Map(e, identityOptions))
                .Distinct(StringComparer.Ordinal)
                .ToArray();

            if (list.Length == 0)
            {
                return ("Password validation failed.", Array.Empty<string>());
            }

            if (list.Length == 1)
            {
                return (list[0], list);
            }

            const string multiSummary = "The new password does not meet the password requirements. See details below.";
            return (multiSummary, list);
        }
    }
}
