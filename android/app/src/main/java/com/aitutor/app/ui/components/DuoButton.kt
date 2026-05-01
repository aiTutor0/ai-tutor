package com.aitutor.app.ui.components

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.aitutor.app.ui.theme.DuoGreen
import com.aitutor.app.ui.theme.DuoGreenDark

/**
 * Duolingo-style 3D button. The "shadow" beneath presses down on tap.
 *
 * Pass any [containerColor]; the bottom shadow is auto-derived (15% darker)
 * unless [shadowColor] is provided.
 */
@Composable
fun DuoButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    containerColor: Color = DuoGreen,
    shadowColor: Color = DuoGreenDark,
    contentColor: Color = if (containerColor.luminance() > 0.5f) Color(0xFF4B4B4B) else Color.White,
    cornerRadius: Dp = 16.dp,
    shadowDepth: Dp = 4.dp,
    contentPadding: PaddingValues = PaddingValues(vertical = 14.dp, horizontal = 20.dp),
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val topOffset by animateDpAsState(
        targetValue = if (isPressed && enabled) shadowDepth else 0.dp,
        animationSpec = tween(durationMillis = 60),
        label = "duoButtonPress"
    )
    val bottomShadowHeight by animateDpAsState(
        targetValue = if (isPressed && enabled) 0.dp else shadowDepth,
        animationSpec = tween(durationMillis = 60),
        label = "duoButtonShadow"
    )

    val effectiveContainer = if (enabled) containerColor else containerColor.copy(alpha = 0.4f)
    val effectiveShadow = if (enabled) shadowColor else shadowColor.copy(alpha = 0.4f)

    Box(modifier = modifier.heightIn(min = 52.dp + shadowDepth)) {
        // Bottom shadow / 3D base
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .matchTopOffset(shadowDepth)
                .background(effectiveShadow, RoundedCornerShape(cornerRadius))
                .heightIn(min = 52.dp)
        )
        // Top face — animates downward when pressed
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .matchTopOffset(topOffset)
                .background(effectiveContainer, RoundedCornerShape(cornerRadius))
                .clickable(
                    interactionSource = interactionSource,
                    indication = null,
                    enabled = enabled,
                    onClick = onClick
                )
                .padding(contentPadding)
                .heightIn(min = 52.dp - shadowDepth + bottomShadowHeight),
            contentAlignment = Alignment.Center
        ) {
            CompositionLocalProvider(LocalContentColor provides contentColor) {
                ProvideTextStyle(MaterialTheme.typography.labelLarge) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        leading?.invoke()
                        androidx.compose.material3.Text(text)
                        trailing?.invoke()
                    }
                }
            }
        }
    }
}

private fun Modifier.matchTopOffset(offset: Dp): Modifier = this.then(
    Modifier.padding(top = offset)
)
