console.log("portfolio 서비스가 로드되었습니다.");

// 서비스별 기능을 여기에 구현
document.addEventListener("DOMContentLoaded", (): void => {
  console.log("DOM이 로드되었습니다.");

  // 예제: 기능 카드 클릭 이벤트
  const featureCards = document.querySelectorAll<HTMLElement>(".feature-card");

  featureCards.forEach((card: HTMLElement, index: number) => {
    card.addEventListener("click", (): void => {
      alert(`기능 ${index + 1}을 클릭했습니다!`);
    });

    card.style.cursor = "pointer";
  });
});
