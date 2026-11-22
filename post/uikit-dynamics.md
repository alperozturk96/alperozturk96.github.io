I love listening to podcasts about programming and computer science. A few months ago, while listening to a podcast about iOS development, one of the engineers mentioned

[UIKit Dynamics](<https://developer.apple.com/documentation/uikit/uikit-dynamics>)  and pointed out that you can add collision behaviors to **UIView** using this API. I didn’t know that at the time, and I was surprised. I immediately wanted to explore it.

This API felt like a hidden gem to me. I like Apple’s APIs, especially when it comes to animations, and UIKit Dynamics is no exception.

# UIDynamicItem Protocol

Since iOS 7, both  [UIView](<https://developer.apple.com/documentation/uikit/uiview>)  and  [UICollectionViewLayoutAttributes](<https://developer.apple.com/documentation/uikit/uicollectionviewlayoutattributes>)  conform to the  [UIDynamicItem](<https://developer.apple.com/documentation/uikit/uidynamicitem>)  protocol.

That means we can treat our views as dynamic items and apply physics-based behaviors to them.

# How to implement?

First, we create an instance of **UIDynamicAnimator**. Then we define a set of behaviors such as **UIGravityBehavior** and **UICollisionBehavior**, and apply them to our **UIView** instances. The result looks something like this:

<video class="video" controls="">
    <source src="/asset/uikit-dynamics/UIKitDynamicsDemo.mp4" type="video/mp4">
    Your browser does not support the video tag.
</video>

# Let’s walk through the implementation.

First, I define some constants for the labels: their text, color options, and dynamic behaviors.

```swift
private var animator: UIDynamicAnimator?
private let labelTexts = Array("UIKITDYNAMICS").map { String($0) }
private let colors: [UIColor] = [.red, .green, .blue, .white, .yellow, .systemRed, .systemCyan, .orange, .magenta]
private let gravityBehavior = UIGravityBehavior()
private let collisionBehavior = UICollisionBehavior()
```

# Creating UILabels

These helper functions generate labels with a randomized X-position so that the letters fall from different horizontal locations.

```swift
private func getXPosition() -> CGFloat {
    let xPositionDividers: [CGFloat] = [2, 4, 6, 8, 10, 12]
    let xPositionDivider: CGFloat = xPositionDividers.randomElement() ?? 2.0
    return view.frame.width / xPositionDivider
}

private func createLabel(text: String, color: UIColor) -> UILabel? {
    let xPosition = getXPosition()
    let size: CGFloat = 100

    let label = UILabel(frame: .init(x: xPosition, y: 0, width: size, height: 70))
    label.text = text
    label.textColor = color
    label.translatesAutoresizingMaskIntoConstraints = false
    label.font = .systemFont(ofSize: size, weight: .bold)

    return label
}
```

# Adding UIDynamicItems

After creating a label, I add it to the view hierarchy and apply the dynamic behaviors.

```swift
override func viewDidLoad() {
    super.viewDidLoad()

    view.backgroundColor = .black

    animator = UIDynamicAnimator(referenceView: view)
    addBehaviours()

    for (index, text) in labelTexts.enumerated() {
        DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(index)) { [weak self] in
            guard let self else { return }
            self.createAndAddLabelToUIDynamicBehaviors(text)
        }
    }
}

private func addBehaviours() {
    collisionBehavior.translatesReferenceBoundsIntoBoundary = true
    animator?.addBehavior(gravityBehavior)
    animator?.addBehavior(collisionBehavior)
}

private func createAndAddLabelToUIDynamicBehaviors(_ text: String) {
    let color = colors.randomElement() ?? .white
    guard let label = createLabel(text: text, color: color) else { return }

    view.addSubview(label)
    gravityBehavior.addItem(label)
    collisionBehavior.addItem(label)
}
```

# Conclusion

And that’s it! With just a few lines of code, we have UILabels affected by gravity and collision. Of course, there’s much more we can do. For example, we can add drag-and-drop support. But that’s a topic for another post!

# Source Code

```swift
import UIKit

final class ViewController: UIViewController {

    private var animator: UIDynamicAnimator?
    private let labelTexts = Array("UIKITDYNAMICS").map { String($0) }
    private let colors: [UIColor] = [.red, .green, .blue, .white, .yellow, .systemRed, .systemCyan, .orange, .magenta]
    private let gravityBehavior = UIGravityBehavior()
    private let collisionBehavior = UICollisionBehavior()

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = .black

        animator = UIDynamicAnimator(referenceView: view)
        addBehaviours()

        for (index, text) in labelTexts.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(index)) { [weak self] in
                guard let self else { return }
                self.createAndAddLabelToUIDynamicBehaviors(text)
            }
        }
    }

    private func addBehaviours() {
        collisionBehavior.translatesReferenceBoundsIntoBoundary = true
        animator?.addBehavior(gravityBehavior)
        animator?.addBehavior(collisionBehavior)
    }

    private func createAndAddLabelToUIDynamicBehaviors(_ text: String) {
        let color = colors.randomElement() ?? .white
        guard let label = createLabel(text: text, color: color) else { return }

        view.addSubview(label)
        gravityBehavior.addItem(label)
        collisionBehavior.addItem(label)
    }

    private func getXPosition() -> CGFloat {
        let xPositionDividers: [CGFloat] = [2, 4, 6, 8, 10, 12]
        let xPositionDivider: CGFloat = xPositionDividers.randomElement() ?? 2.0
        return view.frame.width / xPositionDivider
    }

    private func createLabel(text: String, color: UIColor) -> UILabel? {
        let xPosition = getXPosition()
        let size: CGFloat = 100

        let label = UILabel(frame: .init(x: xPosition, y: 0, width: size, height: 70))
        label.text = text
        label.textColor = color
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: size, weight: .bold)

        return label
    }
}
```
