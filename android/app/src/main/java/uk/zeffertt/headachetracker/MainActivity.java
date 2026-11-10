package uk.zeffertt.headachetracker;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // When Android reopens the app from the recents list it replays the original intent.
        // Drop the shortcut link in that case, so "Headache started" never fires twice.
        Intent intent = getIntent();
        if (intent != null && (intent.getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) {
            intent.setData(null);
        }
        super.onCreate(savedInstanceState);
    }
}
