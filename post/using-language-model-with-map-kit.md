While watching Apple's latest WWDC event videos, I became interested in exploring the new  [Foundation Models](<https://developer.apple.com/documentation/FoundationModels>)  framework. Personally, I find using language models locally more reliable approach than cloud-based ones.

For demonstration purposes, I wanted to build something both meaningful and practical.

# Use Case

Imagine you are exploring a new place and want recommendations without having to open a search engine. Map apps are especially useful when you're unfamiliar with the area. While using a map app to see where you are, you could simply ask your assistant for suggestions like where to eat or what to see nearby. This is one potential use case I aimed to implement.

# Details

I used Apple’s MapKit with their Foundation Model. I’m currently using macOS 15.5 with Xcode 26 Beta 4 and iOS 26 Beta. However, I realized that the Foundation Model doesn’t seem to be available unless I’m running macOS 26 Beta as well. When I try to use it, I encountered an error stating that no model was found.

To handle this, I checked for the model’s availability using  [SystemLanguageModel.default](<https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel>)  . If the model isn't available, I fallback to a locally hosted model on my 10-core M2 Pro MacBook, specifically  [liquid/lfm2-1.2b](<https://lmstudio.ai/models/liquid/lfm2-1.2b>)  . Initially, I tried  [google/gemma-3-12b](<https://lmstudio.ai/models/google/gemma-3-12b>)  , but the response time was around 60 seconds. Switching to a lower-parameter model provided a good balance between output quality and speed.

# Implementation

I wanted to display a full-screen map with two buttons below it, one for search and the other for the assistant feature. Since both require user input, I included input fields. To ensure smooth transitions between actions and to align with the latest design guidelines, I added screen state to my view.

## MapActionState

```swift

enum MapActionState {
    case assistant, search, idle
}

```

Before diving into how I used the `MapActionState`, I want to explain how I handled the transition between the two modes.

## GlassEffectContainer

This container allows you to create a component from other a component. It's like pulling a piece from one component to build another, creating smooth transitions between the two.

```swift

struct TestGlassEffectContainer: View {
    @State private var isExpanded: Bool = false
    @Namespace private var namespace

    var body: some View {
        GlassEffectContainer(spacing: 40.0) {
            HStack(spacing: 40.0) {
                Image(systemName: "plus.circle.fill")
                    .frame(width: 80.0, height: 80.0)
                    .font(.system(size: 36))
                    .glassEffect()
                    .glassEffectID("plus", in: namespace)


                if isExpanded {
                    Image(systemName: "ellipsis.circle.fill")
                        .frame(width: 80.0, height: 80.0)
                        .font(.system(size: 36))
                        .glassEffect()
                        .glassEffectID("more", in: namespace)
                }
            }
        }

        Button("Animate") {
            withAnimation {
                isExpanded.toggle()
            }
        }
        .buttonStyle(.glass)
    }
}

```

<video class="video" controls="">
    <source src="/asset/using-language-model-with-map-kit/1.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>

## Transition Between Assistant and Search

```swift

// MARK: - ChildViews
extension ContentView {
    private var MapActionButtons: some View {
        GlassEffectContainer {
            HStack {
                if state != .assistant {
                    ImageButton("apple.intelligence") {
                        state = .assistant
                    }
                    .glassEffectID("assistant", in: namespace)
                }

                switch(state) {
                    case .idle:
                        Spacer()
                    case .assistant:
                        AssistantView(namespace: namespace)
                        Spacer()
                    case .search:
                        Spacer()
                        SearchBottomBar
                }

                if state != .search {
                    ImageButton("magnifyingglass.circle.fill") {
                        state = .search
                    }
                    .glassEffectID("search", in: namespace)
                }
            }
            .padding(.horizontal, 8)
        }
    }
}

```

<video class="video" controls="">
    <source src="/asset/using-language-model-with-map-kit/2.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>

## MapKit

Creating a map in SwiftUI is quite straightforward, but there are a few nuances. You can construct a `Map` instance using  [MapCameraPosition](<https://developer.apple.com/documentation/mapkit/mapcameraposition>)  or the deprecated `MKCoordinateRegion`. Since  [MKCoordinateRegion](<https://developer.apple.com/documentation/mapkit/mkcoordinateregion>)  is deprecated as of iOS 17, I used `MapCameraPosition`, which still uses coordinates. I also added a slider on the right side of the map to control the zoom level.

```swift

import SwiftUI
import MapKit

struct MapContentView<MapActionButtons: View>: View {
    @Binding private var zoomLevel: Double
    @Binding private var currentCenter: CLLocationCoordinate2D
    @Binding private var cameraPosition: MapCameraPosition

    @Binding private var state: MapActionState
    private let sliderHeight: CGFloat
    @ViewBuilder private var mapActionButtons: MapActionButtons

    init(
        _ zoomLevel: Binding<Double>,
        _ currentCenter: Binding<CLLocationCoordinate2D>,
        _ cameraPosition: Binding<MapCameraPosition>,
        _ state: Binding<MapActionState>,
        _ sliderHeight: CGFloat,
        @ViewBuilder mapActionButtons: @escaping () -> MapActionButtons
    ) {
        self._zoomLevel = zoomLevel
        self._currentCenter = currentCenter
        self._cameraPosition = cameraPosition
        self._state = state
        self.sliderHeight = sliderHeight
        self.mapActionButtons = mapActionButtons()
    }

    var body: some View {
        ZStack {
            ContentMap
                .overlay(alignment: .bottom) {
                    mapActionButtons
                }
                .onTapGesture {
                    state = .idle
                }

            MapSlider(sliderHeight)
        }
    }
}

// MARK: - ChildViews
extension MapContentView {
    @ViewBuilder
    private var ContentMap: some View {
        Map(position: $cameraPosition)
            .onMapCameraChange { context in
                currentCenter = context.region.center
            }
    }

    @ViewBuilder
    private func MapSlider(_ bottomPadding: CGFloat) -> some View {
        Slider(value: $zoomLevel, in: 0.001...0.1)
            .onChange(of: zoomLevel) { oldValue, newValue in
                cameraPosition = MapCameraPosition.region(
                    MKCoordinateRegion(
                        center: currentCenter,
                        span: MKCoordinateSpan(latitudeDelta: newValue, longitudeDelta: newValue)
                    )
                )
            }
            .rotationEffect(.degrees(-90), anchor: .trailing)
            .padding(.bottom, bottomPadding)
            .padding(.trailing, 24)
    }
}

```

Whenever `zoomLevel` changes, I update the camera position. By applying  [rotationEffect](<https://developer.apple.com/documentation/swiftui/view/rotationeffect(_:anchor:)>)  , I transformed the horizontal slider into a vertical one.

<video class="video" controls="">
    <source src="/asset/using-language-model-with-map-kit/3.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>

## AssistantView

In this view, users can enter prompts and receive answers, either from Apple’s Foundation Model, if available or from a locally hosted language model. In my case, I used `liquid/lfm2-1.2b`. Of course, you can replace this with a remote model if needed. For demonstration, I used my local development environment. The model runs entirely on my M2 Pro MacBook.

Another technical challenge was that generating answers, especially with local models can take some time. Rather than using a basic loading spinner, I decided to implement a glowing effect around the `AssistantView` to indicate activity.

```swift

import SwiftUI
import FoundationModels

struct AssistantView: View {
    private let model = SystemLanguageModel.default
    private let localLM = LocalLM()
    private let namespace: Namespace.ID

    @State private var gradientTimer: Timer?
    @State private var gradientStops: [Gradient.Stop] = GradientConfig.defaultStops
    @State private var prompt = ""
    @State private var isLoading = false
    @State private var answer: String = ""

    init(namespace: Namespace.ID) {
        self.namespace = namespace
    }

    var body: some View {
        HStack {
            SparkleIcon

            if isLoading {
                LoadingView
            } else {
                InputField
            }

            if !prompt.isEmpty && !isLoading {
                ClearButton
            }
        }
        .padding()
        .overlay(LoadingOverlay)
        .glassEffect()
        .glassEffectID("assistantContent", in: namespace)
        .sheet(isPresented: showAnswerBinding) {
            AnswerSheet
        }
    }
}

// MARK: - View Components
private extension AssistantView {
    var SparkleIcon: some View {
        Image(systemName: "sparkles")
            .foregroundColor(.gray)
    }

    var LoadingView: some View {
        Text("Thinking...")
            .frame(maxWidth: .infinity, alignment: .leading)
            .font(.title3)
    }

    var InputField: some View {
        TextField("Ask...", text: $prompt)
            .font(.title3)
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
            .onSubmit {
                askAssistant()
            }
    }

    var ClearButton: some View {
        Button(action: clearPrompt) {
            Image(systemName: "xmark.circle.fill")
                .foregroundColor(.gray)
        }
    }

    @ViewBuilder
    var LoadingOverlay: some View {
        if isLoading {
            Capsule()
                .glowEffect(
                    style: .angularGradient(
                        stops: gradientStops,
                        center: .center,
                        startAngle: .degrees(0),
                        endAngle: .degrees(360)
                    )
                )
                .onAppear(perform: startGradientAnimation)
                .onDisappear(perform: stopGradientAnimation)
        }
    }

    var AnswerSheet: some View {
        VStack(alignment: .leading, spacing: 16) {
            ScrollView {
                Text(answer)
                    .font(.body)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding()
        .presentationDetents([.fraction(0.3), .medium])
    }

    var showAnswerBinding: Binding<Bool> {
        Binding(
            get: { !answer.isEmpty },
            set: { if !$0 { answer = "" } }
        )
    }
}

// MARK: - Actions
private extension AssistantView {
    func clearPrompt() {
        prompt = ""
    }

    func startGradientAnimation() {
        stopGradientAnimation()
        gradientTimer = Timer.scheduledTimer(withTimeInterval: 0.04, repeats: true) { _ in
            shiftGradientStops()
        }
    }

    func stopGradientAnimation() {
        gradientTimer?.invalidate()
        gradientTimer = nil
    }

    func shiftGradientStops() {
        let step = 0.02
        gradientStops = gradientStops.map { stop in
            var newLocation = stop.location + step
            if newLocation > 1 { newLocation -= 1 }
            return Gradient.Stop(color: stop.color, location: newLocation)
        }.sorted { $0.location < $1.location }
    }

    func askAssistant() {
        guard !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        Task {
            await processAssistantRequest()
        }
    }

    @MainActor
    func processAssistantRequest() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let response: String

            if model.availability == .available {
                response = try await getSystemModelResponse()
            } else {
                response = try await getLocalModelResponse()
            }

            answer = response
            prompt = ""

        } catch {
            print("Assistant Error: \(error.localizedDescription)")
        }
    }

    func getSystemModelResponse() async throws -> String {
        let session = LanguageModelSession()
        let response = try await session.respond(to: prompt)
        return response.content
    }

    func getLocalModelResponse() async throws -> String {
        return try await localLM.askLocalAssistant(prompt: prompt)
    }
}

// MARK: - Configuration
private enum GradientConfig {
    static let defaultStops: [Gradient.Stop] = [
        .init(color: .blue, location: 0.0),
        .init(color: .purple, location: 0.2),
        .init(color: .red, location: 0.4),
        .init(color: .mint, location: 0.5),
        .init(color: .indigo, location: 0.7),
        .init(color: .pink, location: 0.9),
        .init(color: .blue, location: 1.0)
    ]
}

```

<video class="video" controls="">
    <source src="/asset/using-language-model-with-map-kit/4.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>

## Glowing Effect

This extension allows you to draw a stroke around a shape using a specified `ShapeStyle`.

```swift

extension View where Self: Shape {
    func glowEffect(style: some ShapeStyle, _ width: Double = 4.0) -> some View {
        let strokeStyle = StrokeStyle(lineWidth: width, lineCap: .round)
        let baseStrokeStyle = StrokeStyle(lineWidth: width / 2, lineCap: .round)
        let firstLayer = glowLayer(style: style, strokeStyle: strokeStyle, blur: 8.0)
        let secondLayer = glowLayer(style: style, strokeStyle: strokeStyle, blur: 8.0 / 2)

        return self
            .stroke(style: baseStrokeStyle)
            .fill(style)
            .background(firstLayer)
            .background(secondLayer)
    }

    private func glowLayer(
        style: some ShapeStyle,
        strokeStyle: StrokeStyle,
        blur: Double
    ) -> some View {
        self
            .stroke(style: strokeStyle)
            .fill(style)
            .blur(radius: blur)
    }
}

```

The `LoadingOverlay` is just a `Capsule` using this glow extension. I applied an angular gradient for the `ShapeStyle`. With a repeating timer, I continuously update the  [Gradient.Stop](<https://developer.apple.com/documentation/swiftui/gradient/stop>)  values to create a dynamic, spinning color effect that doesn’t feel static.

```swift

@ViewBuilder
    var LoadingOverlay: some View {
        if isLoading {
            Capsule()
                .glowEffect(
                    style: .angularGradient(
                        stops: gradientStops,
                        center: .center,
                        startAngle: .degrees(0),
                        endAngle: .degrees(360)
                    )
                )
                .onAppear(perform: startGradientAnimation)
                .onDisappear(perform: stopGradientAnimation)
        }
    }

```

## Interacting with the Locally Hosted Model

Here are our configuration options and possible errors for interacting with the locally hosted language model.

```swift

enum SystemPrompts {
    static let restaurantRecommendation = """
        You are a helpful assistant that provides local food and restaurant recommendations
        based on the user's location or the city they mention. Recommend a mix of popular,
        unique, and culturally significant places.
        """
}

enum LanguageModelAPI: String {
    case localHost = "http://localhost:1234/api/v0/chat/completions" // for demo purposes
}

enum LanguageModel: String {
    case liquid = "liquid/lfm2-1.2b"
    case gemma = "google/gemma-3-12b"
}

enum LocalLMError: LocalizedError {
    case emptyPrompt
    case invalidURL
    case networkError(Error)
    case invalidResponse
    case serverError(Int, String)
    case decodingError
    case emptyResponse

    var errorDescription: String? {
        switch self {
        case .emptyPrompt:
            return "Prompt cannot be empty"
        case .invalidURL:
            return "Invalid server URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid server response"
        case .serverError(let code, let message):
            return "Server error (\(code)): \(message)"
        case .decodingError:
            return "Failed to decode server response"
        case .emptyResponse:
            return "Server returned empty response"
        }
    }
}

```

Now, let’s take a look at the data structures used for request and response handling.

```swift

struct ChatMessage: Codable {
    let role: String
    let content: String
}

struct ChatRequest: Codable {
    let model: String
    let messages: [ChatMessage]
    let temperature: Double
    let max_tokens: Int
    let stream: Bool
}

struct ChatResponse: Codable {
    struct Choice: Codable {
        let index: Int
        let message: ChatMessage
    }

    let choices: [Choice]
    let usage: Usage?

    struct Usage: Codable {
        let prompt_tokens: Int
        let completion_tokens: Int
        let total_tokens: Int
    }
}

```

Here is the actual implementation of the local model request.

```swift


import Foundation

struct LocalLM {
    private let baseURL: LanguageModelAPI
    private let model: LanguageModel
    private let timeout: TimeInterval
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(
        baseURL: LanguageModelAPI = .localHost,
        model: LanguageModel = .liquid,
        timeout: TimeInterval = 60
    ) {
        self.baseURL = baseURL
        self.model = model
        self.timeout = timeout
    }

    func askLocalAssistant(prompt: String) async throws -> String {
        guard !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw LocalLMError.emptyPrompt
        }

        let request = try buildRequest(for: prompt)
        let response = try await performRequest(request)
        return try parseResponse(response)
    }
}

// MARK: - Private Methods
private extension LocalLM {
    func buildRequest(for prompt: String) throws -> URLRequest {
        guard let url = URL(string: baseURL.rawValue) else {
            throw LocalLMError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = timeout

        let requestBody = ChatRequest(
            model: model.rawValue,
            messages: [
                ChatMessage(
                    role: "system",
                    content: SystemPrompts.restaurantRecommendation
                ),
                ChatMessage(role: "user", content: prompt)
            ],
            temperature: 0.7,
            max_tokens: -1,
            stream: false
        )

        request.httpBody = try encoder.encode(requestBody)
        return request
    }

    func performRequest(_ request: URLRequest) async throws -> (Data, URLResponse) {
        do {
            return try await URLSession.shared.data(for: request)
        } catch {
            throw LocalLMError.networkError(error)
        }
    }

    func parseResponse(_ response: (Data, URLResponse)) throws -> String {
        let (data, urlResponse) = response

        guard let httpResponse = urlResponse as? HTTPURLResponse else {
            throw LocalLMError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown server error"
            throw LocalLMError.serverError(httpResponse.statusCode, errorMessage)
        }

        do {
            let decoded = try decoder.decode(ChatResponse.self, from: data)

            guard let content = decoded.choices.first?.message.content,
                  !content.isEmpty else {
                throw LocalLMError.emptyResponse
            }

            return content
        } catch is DecodingError {
            throw LocalLMError.decodingError
        }
    }
}

```

## Result

<video class="video" controls="">
    <source src="/asset/using-language-model-with-map-kit/res.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>

# Conclusion

It was incredibly fun experimenting with a locally hosted language model using Swift and SwiftUI. Once again, I’m impressed by how easy and intuitive Apple’s APIs make development.
