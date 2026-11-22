For a long time, I’ve been thinking about integrating an interval timer into my music player app. At first glance, this seems simple, but there are many small details to handle in order to achieve a robust implementation. In this blog post, I’ll share my approach with you.

# Use Case

While listening to music, I want to be able to do my boxing workouts with an interval timer — for example, 10 sets with 300 seconds of workout time and 60 seconds of rest. The same setup could be useful for yoga or other exercises as well. The key challenge is that the music may be loud, and I still need to clearly know when to rest, when to work, and when the timer will stop.

Transitions between these states must be obvious to the user. The user should also be able to pause or cancel the interval timer whenever needed.

# Implementation

My music application is built with Jetpack Compose, and I already have an `AudioPlayer` class that handles track playback.

## IntervalTimerAlertDialog

From this alert dialog, we collect the set count, workout time, and rest time from the user, then start the `IntervalTimerService`. We also save the user’s last choice so that the next time the dialog is opened, the previously selected values are shown by default.

```kotlin

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource

@Composable
fun IntervalTimerAlertDialog(dismiss: () -> Unit) {
    val context = LocalContext.current

    var numberOfSets by remember { mutableFloatStateOf(UserStorage.readIntervalSets().toFloat()) }
    var workDuration by remember { mutableFloatStateOf(UserStorage.readIntervalWork().toFloat()) }
    var restDuration by remember { mutableFloatStateOf(UserStorage.readIntervalRest().toFloat()) }

    SimpleAlertDialog(
        titleId = R.string.interval_timer_alert_dialog_title,
        titleIconId = null,
        titleIconAction = null,
        description = stringResource(
            id = R.string.interval_timer_alert_dialog_description,
            numberOfSets.toInt().toString(),
            workDuration.toInt().toString(),
            restDuration.toInt().toString()
        ),
        content = {
            Column {
                Text(stringResource(R.string.interval_timer_sets_label, numberOfSets.toInt()))
                Slider(
                    colors = SliderDefaults.colors(activeTrackColor = AppColors.red),
                    modifier = Modifier.fillMaxWidth(),
                    value = numberOfSets,
                    valueRange = 1f..15f,
                    onValueChange = { numberOfSets = it }
                )

                Text(stringResource(R.string.interval_timer_work_label, workDuration.toInt()))
                Slider(
                    colors = SliderDefaults.colors(activeTrackColor = AppColors.red),
                    modifier = Modifier.fillMaxWidth(),
                    value = workDuration,
                    valueRange = 5f..300f,
                    onValueChange = { workDuration = it }
                )

                Text(stringResource(R.string.interval_timer_rest_label, restDuration.toInt()))
                Slider(
                    colors = SliderDefaults.colors(activeTrackColor = AppColors.red),
                    modifier = Modifier.fillMaxWidth(),
                    value = restDuration,
                    valueRange = 5f..300f,
                    onValueChange = { restDuration = it }
                )
            }
        },
        onComplete = {
            context.startIntervalTimerService(
                numberOfSets = numberOfSets,
                workDuration = workDuration,
                restDuration = restDuration,
            )
            UserStorage.saveIntervalTimerConfig(
                numberOfSets.toInt(),
                workDuration.toInt(),
                restDuration.toInt()
            )
        },
        dismiss = { dismiss() }
    )
}

fun Context.startIntervalTimerService(numberOfSets: Float, workDuration: Float, restDuration: Float) {
    val intent = Intent(this, IntervalTimerService::class.java).apply {
        putExtra(IntervalTimerService.SETS, numberOfSets.toInt())
        putExtra(IntervalTimerService.WORK_SEC, workDuration.toInt())
        putExtra(IntervalTimerService.REST_SEC, restDuration.toInt())
    }

    startService(intent)
}

```

## IntervalTimerService

We need a service implementation because the interval timer must continue running even when the app is in the background. After creating the service class, we must also register it in the `AndroidManifest.xml` with the foreground service type set to `mediaPlayback`.

The service supports two intent actions along with its start logic. If the action is `CANCEL`, we simply stop the service. If the action is `TOGGLE`, we flip the flag that the service holds to pause or resume the timer. This also allows us to update the notification text for the toggle action accordingly.

We update the notification after each action so that the most recent state is reflected immediately. In the case of a resume toggle, we don’t need to update the text right away, because it will refresh automatically one second later when the timer continues.

When the service receives the necessary values for the timer logic, we can start it. I used three separate variables for simplicity, but you could also encapsulate them in a single data class.

```kotlin

private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
private var isRunning = true

override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
        ACTION_CANCEL -> {
            stopSelf()
            return START_NOT_STICKY
        }

        ACTION_TOGGLE -> {
            isRunning = !isRunning
            val currentText = if (isRunning) {
                // It will be updated in one second
                ""
            } else {
                getString(R.string.interval_timer_paused_text)
            }
            updateNotification(currentText)
            return START_STICKY
        }

        else -> {
            val sets = intent?.getIntExtra(SETS, 3) ?: 3
            val workSec = intent?.getIntExtra(WORK_SEC, 30) ?: 30
            val restSec = intent?.getIntExtra(REST_SEC, 10) ?: 10

            startForegroundServiceWithNotification()

            serviceScope.launch {
                runIntervalTimer(sets, workSec, restSec)
                stopSelf()
            }
        }
    }
    return START_STICKY
}

```

Since the timer runs through a series of sets, each consisting of a countdown, it makes sense to divide the logic into three main parts:

Play beep → Countdown → Repeat for each set.

During the first set, there is no need to play a beep since the user is just starting the workout. The function suspends until the countdown completes. After that, the rest phase begins, and this cycle repeats for each set until the workout is complete.

```kotlin

private suspend fun runIntervalTimer(sets: Int, workSec: Int, restSec: Int) {
    repeat(sets) { index ->
        // Work phase
        if (index != 0) {
            playBeep(BeepType.WORK_START)
        }

        countdown(workSec, sets, index + 1, isWork = true)

        // Rest phase (skip after last set)
        if (index < sets - 1) {
            playBeep(BeepType.REST_START)
            countdown(restSec, sets, index + 1, isWork = false)
        }
    }
    playBeep(BeepType.WORKOUT_COMPLETE)
}

private suspend fun countdown(
    seconds: Int,
    sets: Int,
    currentSet: Int,
    isWork: Boolean
) {
    var remaining = seconds
    while (remaining > 0) {
        if (!isRunning) {
            // Check every 100ms if we should resume
            delay(100)
            continue
        }

        val text = if (isWork) {
            getString(
                R.string.interval_timer_in_progress_text,
                currentSet,
                sets,
                remaining
            )
        } else {
            getString(
                R.string.interval_timer_resting_text,
                currentSet,
                sets,
                remaining
            )
        }
        updateNotification(text)
        delay(ONE_SECOND)
        remaining--
    }
}

```

The beep logic is crucial for ensuring a smooth transition between music playback and the timer’s feedback sounds. The `AudioPlayer` class implements  [androidx.media3](<https://developer.android.com/jetpack/androidx/releases/media3>)  . The `playBeep` function takes a `BeepType`, which lets us play different tones for work, rest, and workout completion.

If the timer is paused (`isRunning = false`), no beep should be played. Just before playing a beep, we lower the audio player’s volume gradually, insert a short delay, play the beep, and then raise the volume back to its original level. This ensures a smooth user experience.

The  [android.media.ToneGenerator](<https://developer.android.com/reference/android/media/ToneGenerator>)  API is used for beep sounds. This avoids interrupting the `AudioPlayer`. Otherwise, we would need to stop playback, play the beep through the player, and then handle resuming playback — which would complicate the implementation unnecessarily. Using `ToneGenerator` makes the solution much simpler.

```kotlin

private suspend fun playBeep(beepType: BeepType) {
    if (!isRunning) return

    withContext(Dispatchers.Main) {
        audioPlayer.fadeVolumeDown()
    }

    // wait for fade to complete
    delay(400)

    when (beepType) {
        BeepType.WORK_START -> {
            toneGen.startTone(ToneGenerator.TONE_PROP_BEEP, 250)
            delay(300)
        }
        BeepType.REST_START -> {
            repeat(2) {
                toneGen.startTone(ToneGenerator.TONE_DTMF_5, 180)
                delay(200)
            }
        }
        BeepType.WORKOUT_COMPLETE -> {
            val tones = listOf(
                ToneGenerator.TONE_DTMF_1,
                ToneGenerator.TONE_DTMF_4,
                ToneGenerator.TONE_DTMF_7
            )
            tones.forEach { tone ->
                toneGen.startTone(tone, 300)
                delay(250)
            }
        }
    }

    // brief pause before restoring
    delay(200)

    // restore volume
    withContext(Dispatchers.Main) {
        audioPlayer.fadeVolumeUp()
    }
}
    
```

The `changeVolume` function gradually adjusts the volume instead of making a sudden jump. By fading the volume step by step, the transitions feel smoother and improve the overall user experience.

```kotlin

private fun changeVolume(target: Float) {
    mediaSession?.player?.run {
        volumeFadeJob?.cancel()
        volumeFadeJob = viewModelScope.launch(Dispatchers.Main) {
            val volumeStep = (target - volume) / FADE_STEP_COUNT

            repeat(FADE_STEP_COUNT) { step ->
                val newVolume = volume + (volumeStep * step)
                volume = newVolume.coerceIn(MIN_VOLUME, MAX_VOLUME)
                delay(FADE_STEP_DURATION)
            }

            // after gradually increasing the volume, finally set the target volume
            volume = target.coerceIn(MIN_VOLUME, MAX_VOLUME)
        }
    }
}

fun fadeVolumeDown() {
    changeVolume(FADE_VOLUME)
}

fun fadeVolumeUp() {
    changeVolume(MAX_VOLUME)
}
    
```

The notification code looks a bit lengthy, but this is the necessary approach. First, we create a channel for the interval timer. Then, we set up pending intents that trigger the service with the appropriate intent actions.

Once the channel and intents are in place, we can add them to the notification. This way, whenever a notification is created inside the service, it includes two actions — pause/resume and cancel — along with the content that shows the current state of the interval timer.

Don’t forget to add  [android.permission.POST_NOTIFICATIONS](<https://developer.android.com/develop/ui/views/notifications/notification-permission>)  to the manifest and request this permission for Android 13 and above, otherwise the service won’t be able to display notifications.

```kotlin

// region Notification
private fun startForegroundServiceWithNotification() {
    ensureNotificationChannel()
    val notification = createNotification("")
    startForeground(NOTIFICATION_ID, notification)
}

private val notificationTogglePendingIntent: PendingIntent
    get() {
        val toggleIntent = Intent(this, IntervalTimerService::class.java).apply {
            action = ACTION_TOGGLE
        }
        return PendingIntent.getService(
            this,
            15,
            toggleIntent,
            PendingIntent.FLAG_IMMUTABLE
        )
    }

private val notificationCancelPendingIntent: PendingIntent
    get() {
        val cancelIntent = Intent(this, IntervalTimerService::class.java).apply {
            action = ACTION_CANCEL
        }
        return PendingIntent.getService(
            this,
            14,
            cancelIntent,
            PendingIntent.FLAG_IMMUTABLE
        )
    }

private fun ensureNotificationChannel() {
    val channel = NotificationChannel(
        CHANNEL_ID,
        getString(R.string.interval_timer_notification_title),
        NotificationManager.IMPORTANCE_LOW
    ).apply {
        setSound(null, null)
        enableVibration(false)
    }
    notificationManager.createNotificationChannel(channel)
}

private fun updateNotification(text: String) {
    val notification = createNotification(text)
    notificationManager.notify(NOTIFICATION_ID, notification)
}

private fun createNotification(text: String): Notification {
    return NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle(getString(R.string.interval_timer_notification_title))
        .setContentText(text)
        .setSmallIcon(R.drawable.ic_interval_timer)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .setOngoing(true)
        .setSound(null)
        .setDefaults(0)
        .addAction(
            if (isRunning) R.drawable.ic_pause else R.drawable.ic_play,
            getString(
                if (isRunning) R.string.interval_timer_pause_text
                else R.string.interval_timer_resume_text
            ),
            notificationTogglePendingIntent
        )
        .addAction(
            R.drawable.ic_cancel,
            getString(R.string.common_cancel),
            notificationCancelPendingIntent
        )
        .build()
}
// endregion
    
```

Finally, don’t forget to clean up resources in the service class when it’s destroyed.

```kotlin

override fun onDestroy() {
    super.onDestroy()
    serviceScope.cancel()
    toneGen.release()
}
    
```

# Demo

<video class="video" controls="">
    <source src="/asset/integrating-an-interval-timer-into-the-music-player/demo.webm" type="video/webm">
    Your browser does not support the video tag.
</video>

# Conclusion

I’m really happy to have added this functionality to my application, as I’ll be using it almost every day. I hope this blog post helps others who want to achieve similar behavior in their own apps.
