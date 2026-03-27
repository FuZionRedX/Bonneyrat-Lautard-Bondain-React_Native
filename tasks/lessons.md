# Lessons Learned

<!-- Format: [date] | what went wrong | rule to avoid it -->

[2026-03-26] | API base URL was Android-emulator specific and failed on web | Always resolve API base URL by platform and support web-specific environment override.
[2026-03-26] | Theme preference was only local and not returned by profile APIs | Keep UI settings that must persist across devices as explicit profile fields in both save and get endpoints.
[2026-03-26] | Appearance.setColorScheme is not a function on web | Always use optional chaining (`?.`) for React Native APIs that react-native-web may not implement.
[2026-03-27] | Suggested combo total exceeded daily calorie target because each category was optimised independently | When a global constraint exists (daily calorie limit), optimise across all categories together — pick top candidates per category then search the cross-product for the best total that respects the global cap.
