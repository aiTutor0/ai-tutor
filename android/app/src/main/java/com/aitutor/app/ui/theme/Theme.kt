package com.aitutor.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColors = lightColorScheme(
    primary = DuoGreen,
    onPrimary = Color.White,
    primaryContainer = DuoGreen.copy(alpha = 0.15f),
    onPrimaryContainer = DuoGreenDark,

    secondary = DuoYellow,
    onSecondary = Eel,
    secondaryContainer = DuoYellow.copy(alpha = 0.2f),
    onSecondaryContainer = DuoYellowDark,

    tertiary = DuoBlue,
    onTertiary = Color.White,
    tertiaryContainer = DuoBlue.copy(alpha = 0.15f),
    onTertiaryContainer = DuoBlueDark,

    error = DuoRed,
    onError = Color.White,
    errorContainer = DuoRed.copy(alpha = 0.15f),
    onErrorContainer = DuoRedDark,

    background = Snow,
    onBackground = Eel,
    surface = Snow,
    onSurface = Eel,
    surfaceVariant = PaleGrey,
    onSurfaceVariant = Gray700,
    outline = Gray200,
    outlineVariant = Gray100,

    surfaceContainer = PaleGrey,
    surfaceContainerHigh = Gray100,
    surfaceContainerHighest = Gray200
)

private val DarkColors = darkColorScheme(
    primary = DuoGreen,
    onPrimary = Color.White,
    primaryContainer = DuoGreenDark,
    onPrimaryContainer = Color.White,

    secondary = DuoYellow,
    onSecondary = DuoDarkBg,
    secondaryContainer = DuoYellowDark,
    onSecondaryContainer = Color.White,

    tertiary = DuoBlue,
    onTertiary = Color.White,
    tertiaryContainer = DuoBlueDark,
    onTertiaryContainer = Color.White,

    error = DuoRed,
    onError = Color.White,
    errorContainer = DuoRedDark,
    onErrorContainer = Color.White,

    background = DuoDarkBg,
    onBackground = DuoDarkText,
    surface = DuoDarkSurface,
    onSurface = DuoDarkText,
    surfaceVariant = DuoDarkSurfaceVariant,
    onSurfaceVariant = DuoDarkTextSecondary,
    outline = DuoDarkOutline,
    outlineVariant = DuoDarkOutline,

    surfaceContainer = DuoDarkSurface,
    surfaceContainerHigh = DuoDarkSurfaceVariant,
    surfaceContainerHighest = DuoDarkOutline
)

@Composable
fun AITutorTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Brand colors are intentional — keep dynamic colors off so Duo green stays consistent
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColors
        else -> LightColors
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = Color.Transparent.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AITutorTypography,
        shapes = AITutorShapes,
        content = content
    )
}
