Getting the toolbar placement you want in SwiftUI can be tiring. In this blog post, I'll try to make it clearer with a few examples.

# Toolbar view modifier

For these examples, we need a `NavigationStack` to host the navigation bar. Adding `.toolbar` to a standalone view does not create a navigation bar by itself
thus you can't see the toolbar.

Instead of this:

```swift
ZStack {
    Color.white
}
.toolbar {
    ToolbarItem {
        Text("Calendar")
    }
}
```

We should do this:

```swift
NavigationStack {
    ZStack {
        Color.white
    }
    .toolbar {
        ToolbarItem {
            Text("Calendar")
        }
    }
}
```

# ToolbarItem

`ToolbarItem` wraps a view inside the `.toolbar` modifier. Its content can be text, a button with an SF Symbol, or another view.

```swift
NavigationStack {
    ZStack {
        Color.white
    }
    .toolbar {
        ToolbarItem {
            Button {} label: {
                Image(systemName: "1.calendar")
            }
        }
    }
}
```

What happens if we add seven `ToolbarItem`s?

The system can move items that do not fit into an overflow menu. Placement and context also affect their order.

```swift
NavigationStack {
    ZStack {
        Color.white
    }
    .toolbar {
        ForEach(1...7, id: \.self) { day in
            ToolbarItem {
                Button {} label: {
                    Image(systemName: "\(day).calendar")
                }
            }
        }
    }
}
```

## Output

![Five calendar buttons and an overflow button in an iPhone toolbar.](/asset/toolbar-in-swiftui/ToolbarItem_1.png)

In my test, tapping the overflow button did not open a menu.

# ToolbarOverflowMenu

To open a menu we can use [ToolbarOverflowMenu](https://developer.apple.com/documentation/swiftui/toolbaroverflowmenu), available on iOS 27.0+, iPadOS 27.0+, Mac Catalyst 27.0+, and visionOS 27.0+.

Actions will always appear in the overflow menu, even when the toolbar has enough room. Put the buttons directly inside it, without wrapping them in `ToolbarItem`.

```swift
NavigationStack {
    ZStack {
        Color.white
    }
    .toolbar {
        ForEach(1...5, id: \.self) { day in
            ToolbarItem {
                Button {} label: {
                    Image(systemName: "\(day).calendar")
                }
            }
        }

        ToolbarOverflowMenu {
            Button {} label: {
                Image(systemName: "6.calendar")
            }
            Button {} label: {
                Image(systemName: "7.calendar")
            }
        }
    }
}
```

## Output

![An open overflow menu](/asset/toolbar-in-swiftui/ToolbarItem_before_2.png)

![An open overflow menu containing calendar buttons 6 and 7.](/asset/toolbar-in-swiftui/ToolbarItem_2.png)

# ToolbarItemPlacement

Now we can choose a placement for each toolbar item using `ToolbarItemPlacement`.

```swift
NavigationStack {
    ZStack {
        Color.white
    }
    .toolbar {
        // Try .navigation, .cancellationAction, or .topBarPinnedTrailing.
        ToolbarItem(placement: .principal) {
            Button("Calendar 4", systemImage: "4.calendar") {}
        }
    }
}
```

The [placement list](https://developer.apple.com/documentation/swiftui/toolbaritemplacement) is long. Some of them easy to understand. 
SwiftUI also adjusts these automatically for the platform and available space.

For example, in my portrait test, assigning `.navigation`, `.cancellationAction`, or `.principal` to the `4.calendar` button appeared to produce a similar layout:

![Calendar button 4 separated from the other toolbar buttons in portrait.](/asset/toolbar-in-swiftui/ToolbarItem_3.png)

When I assigned [.topBarPinnedTrailing](https://developer.apple.com/documentation/swiftui/toolbaritemplacement/topbarpinnedtrailing) to the same button, it moved after the overflow button:

![Calendar button 4 pinned after the overflow button at the trailing edge.](/asset/toolbar-in-swiftui/ToolbarItem_4.png)

When I rotated the device to landscape, I could clearly see the [.principal](https://developer.apple.com/documentation/swiftui/toolbaritemplacement/principal) item in the center:

![Calendar button 4 centered in the navigation bar in landscape.](/asset/toolbar-in-swiftui/ToolbarItem_5.png)

On iPhone and iPad, [.navigation](https://developer.apple.com/documentation/swiftui/toolbaritemplacement/navigation) and [.cancellationAction](https://developer.apple.com/documentation/swiftui/toolbaritemplacement/cancellationaction) normally appear at the leading edge.

When I included both placements, the cancellation item appeared before the navigation item in this layout:

![Calendar buttons 4 and 5 at the leading edge, with buttons 1 through 3 trailing.](/asset/toolbar-in-swiftui/ToolbarItem_6.png)

## What's the difference between cancellation and destructive actions?

For example while editing document cancel should keep your editing and desctrutive should discards the edits.

# ToolbarItemGroup

[ToolbarItemGroup](https://developer.apple.com/documentation/swiftui/toolbaritemgroup) lets us put related controls next to each other without repeating `ToolbarItem` around every button. Each control still becomes a toolbar item.

```swift
NavigationStack {
    ZStack {
        Color.white
    }
    .toolbar {
        ToolbarItemGroup {
            Button {} label: {
                Image(systemName: "1.calendar")
            }
            Button {} label: {
                Image(systemName: "2.calendar")
            }
            Button {} label: {
                Image(systemName: "3.calendar")
            }
        }
    }
}
```

## Output

![Three calendar buttons together in a toolbar.](/asset/toolbar-in-swiftui/ToolbarItem_7.png)

# ToolbarRole

This part is interesting. I tested both on iPadOS 27.2 and iOS 27.2 but could not see a visual difference. Both looks same on portrait or 
landscape mode.

[.browser](https://developer.apple.com/documentation/swiftui/toolbarrole/browser)
[.editor](https://developer.apple.com/documentation/swiftui/toolbarrole/editor)

Here is the comparison view. Feel free to share a case where the difference is visible.

```swift
struct ToolbarDemo: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Open") {
                    ToolbarRoleComparison()
                }
            }
        }
    }
}

private struct ToolbarRoleComparison: View {
    @State private var role: DemoToolbarRole = .browser

    var body: some View {
        Section("Toolbar role") {
            Picker("Role", selection: $role) {
                ForEach(DemoToolbarRole.allCases) { role in
                    Text(role.rawValue).tag(role)
                }
            }
            .pickerStyle(.menu)
        }
        .navigationTitle("Title")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem {
                Button("Calendar 1", systemImage: "1.calendar") {}
            }
            ToolbarItem {
                Button("Calendar 2", systemImage: "2.calendar") {}
            }
            ToolbarItem {
                Button("Calendar 3", systemImage: "3.calendar") {}
            }
        }
        .toolbarRole(role.value)
    }
}

private enum DemoToolbarRole: String, CaseIterable, Identifiable {
    case automatic = "Automatic"
    case navigationStack = "Navigation Stack"
    case browser = "Browser"
    case editor = "Editor"

    var id: Self { self }

    var value: ToolbarRole {
        switch self {
        case .automatic: .automatic
        case .navigationStack: .navigationStack
        case .browser: .browser
        case .editor: .editor
        }
    }
}
```
