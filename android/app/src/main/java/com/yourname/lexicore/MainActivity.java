package com.yourname.lexicore;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 必须在 super.onCreate 之后，此时 Bridge/WebView 已初始化完成。
        Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }
        WebView webView = bridge.getWebView();
        if (webView == null) {
            return;
        }
        // 组合子类替换 WebViewClient：除 shouldInterceptRequest 外全部走 super，
        // 不破坏 Bridge 回调，也不会因重写其它方法而崩溃。
        webView.setWebViewClient(new CoopCoepClient(bridge));
    }

    /**
     * 为所有本地资源响应追加 CORP 头（Cross-Origin-Resource-Policy: same-origin），
     * 使资源可被同源的 Web 上下文加载。
     *
     * 注意：之前曾注入 COOP/COEP（require-corp）。但 COEP=require-corp 会要求
     * 每个子资源都带 CORP 头，否则被浏览器拦截（"Blocked by COEP"），而 Capacitor
     * 本地文件默认不带该头，导致主 JS/CSS/wasm 全部加载失败 → 白屏。
     * 本项目 Piper TTS 已设为单线程（numThreads=1），不依赖 crossOriginIsolated，
     * 因此移除 COEP 注入即可消除白屏，功能不受影响。
     */
    private static class CoopCoepClient extends BridgeWebViewClient {

        private static final String CORP = "Cross-Origin-Resource-Policy";
        private static final Method SET_HEADERS;

        static {
            Method m = null;
            try {
                m = WebResourceResponse.class.getMethod("setResponseHeaders", Map.class);
            } catch (Throwable ignored) {
                m = null;
            }
            SET_HEADERS = m;
        }

        CoopCoepClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            WebResourceResponse response;
            try {
                response = super.shouldInterceptRequest(view, request);
            } catch (Throwable t) {
                return null;
            }
            if (response == null) {
                return null;
            }
            try {
                return withCorp(response);
            } catch (Throwable t) {
                // 头注入失败也不影响资源加载：返回原始响应。
                return response;
            }
        }

        @SuppressLint("NewApi")
        private WebResourceResponse withCorp(WebResourceResponse response) {
            Map<String, String> headers;
            Map<String, String> existing = response.getResponseHeaders();
            if (existing == null) {
                headers = new HashMap<>();
            } else {
                headers = new HashMap<>(existing);
            }
            if (!headers.containsKey(CORP)) {
                headers.put(CORP, "same-origin");
            }

            // API 29+：直接在原响应上设置头，最安全。返回原响应（已被修改）。
            if (SET_HEADERS != null) {
                try {
                    SET_HEADERS.invoke(response, headers);
                    return response;
                } catch (Throwable ignored) {
                    // 继续降级
                }
            }

            // 低版本：重建响应对象（API 21+ 构造器带状态码/原因短语）。
            int statusCode;
            String reasonPhrase;
            try {
                statusCode = response.getStatusCode();
                reasonPhrase = response.getReasonPhrase();
            } catch (Throwable t) {
                // 无法读取状态码：放弃注入，返回原响应（无害）。
                return response;
            }
            return new WebResourceResponse(
                response.getMimeType(),
                response.getEncoding(),
                statusCode,
                reasonPhrase,
                headers,
                response.getData()
            );
        }
    }
}
