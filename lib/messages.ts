import type { Locale, LocaleRecord } from "@/lib/locale";

export type AppMessages = {
  appName: string;
  languageName: string;
  header: {
    tagline: string;
    brandHomeLabel: string;
    navigationLabel: string;
    menu: {
      home: string;
      aiTrip: string;
      favorites: string;
      myPage: string;
    };
  };
  footer: {
    description: string;
    links: {
      about: string;
      contact: string;
      privacyPolicy: string;
      termsOfService: string;
    };
    rightsReserved: string;
  };
  home: {
    badge: string;
    discoverPlaces: string;
    planWithAi: string;
    regionSectionTitle: string;
    regionSectionDescription: string;
    regionCardDescription: string;
    exploreRegion: string;
    featuredPlacesTitle: string;
    featuredPlacesDescription: string;
    viewAllPlaces: string;
    hero: {
      title: string;
      titleAccent: string;
      subtitleLead: string;
      subtitleRest: string;
      descriptionLead: string;
      descriptionRest: string;
      primaryCta: string;
      secondaryCta: string;
    };
    features: {
      aiPowered: string;
      kyotoSpots: string;
      googleMaps: string;
      gpt: string;
    };
    cards: {
      aiPlan: {
        title: string;
        description: string;
        linkLabel: string;
      };
      map: {
        title: string;
        description: string;
        linkLabel: string;
      };
      save: {
        title: string;
        description: string;
        linkLabel: string;
      };
    };
  };
  travelForm: {
    title: string;
    description: string;
    requiredLabel: string;
    requiredItems: string;
    selectPlaceholder: string;
    destination: {
      label: string;
      placeholder: string;
      help: string;
    };
    days: {
      label: string;
      unit: string;
    };
    travelers: {
      label: string;
      unit: string;
    };
    budget: {
      label: string;
      optionLabels: string[];
    };
    interests: {
      label: string;
      multipleSelection: string;
      selectedSuffix: string;
      clearAll: string;
      optionLabels: string[];
    };
    specialRequest: {
      label: string;
      optional: string;
      placeholder: string;
      help: string;
    };
    advancedConditions: {
      label: string;
      description: string;
    };
    startLocation: {
      label: string;
      placeholder: string;
    };
    startTime: {
      label: string;
    };
    endLocation: {
      label: string;
      placeholder: string;
    };
    endTime: {
      label: string;
    };
    submit: {
      idle: string;
      loading: string;
      incomplete: string;
      loadingStatus: string;
    };
  };
  chatPage: {
    badge: string;
    title: string;
    description: string;
    plannerLabel: string;
    plannerStatus: string;
    locationLabel: string;
    locationReady: string;
    locationLoading: string;
    formTitle: string;
    formDescription: string;
    errorMessage: string;
  };
  travelPlanHeader: {
    imageAlt: string;
    description: string;
    info: {
      durationLabel: string;
      durationValue: string;
      spotsLabel: string;
      spotsValue: string;
      areaLabel: string;
      areaValue: string;
      planLabel: string;
      planValue: string;
    };
  };
  travelTimeline: {
    brandLabel: string;
    dayPrefix: string;
    daySuffix: string;
    spotCountSuffix: string;
    emptyMessage: string;
    unknownSpot: string;
  };
  timelineItem: {
    descriptionFallback: string;
    transport: {
      walking: string;
      jr: string;
      train: string;
      subway: string;
      bus: string;
      taxi: string;
    };
  };
  timelineMapButton: {
    label: string;
    ariaLabelPrefix: string;
    ariaLabelSuffix: string;
  };
  travelPlanCard: {
    actions: {
      addFavorite: string;
      removeFavorite: string;
      favoriteTitle: string;
      copy: string;
      copyTitle: string;
      savePdf: string;
      savePdfTitle: string;
      save: string;
      saveTitle: string;
      saving: string;
      openRoute: string;
      mapsTitle: string;
      share: string;
      shareTitle: string;
    };
    routeSegments: {
      title: string;
      description: string;
      fromLabel: string;
      toLabel: string;
      walking: string;
      transit: string;
      automatic: string;
      open: string;
      close: string;
    };
    alerts: {
      copySuccess: string;
      copyFailed: string;
      pdfFailed: string;
      loginRequired: string;
      invalidPlan: string;
      authChanged: string;
      saveSuccess: string;
      saveFailed: string;
      shareUnavailable: string;
      shareCopySuccess: string;
      shareFailed: string;
      noRouteSpots: string;
      mapsFailed: string;
    };
    info: {
      durationLabel: string;
      daySuffix: string;
      spotsLabel: string;
      spotSuffix: string;
      areaLabel: string;
      defaultArea: string;
      aiLabel: string;
      aiValue: string;
    };
    summaryEyebrow: string;
    summaryTitle: string;
    mapEyebrow: string;
    mapTitle: string;
  };
  favoriteButton: {
    saveAriaLabel: string;
    savedAriaLabel: string;
    favoriteLabel: string;
    savedLabel: string;
  };
  copyButton: {
    copyAriaLabel: string;
    copiedAriaLabel: string;
    copyLabel: string;
    copiedLabel: string;
  };
  pdfButton: {
    creatingAriaLabel: string;
    completedAriaLabel: string;
    saveAriaLabel: string;
    creatingLabel: string;
    savedLabel: string;
    saveLabel: string;
    completedStatus: string;
  };
  shareButton: {
    copiedAlert: string;
    label: string;
  };
  travelPlanSkeleton: {
    ariaLabel: string;
    badge: string;
    title: string;
    description: string;
    preparingLabel: string;
    waitMessage: string;
    steps: Array<{
      label: string;
      description: string;
    }>;
  };
  interactiveTravelMap: {
    unavailableTitle: string;
    missingApiKeyMessage: string;
    mapAriaLabel: string;
    openGoogleMaps: string;
    spotCountSuffix: string;
  };
  dashboard: {
    title: string;
    logout: string;
    loggingOut: string;
    welcomeSuffix: string;
    savedPlansTitle: string;
    showAll: string;
    favoritesOnly: string;
    searchPlaceholder: string;
    emptyMessage: string;
    createdAtLabel: string;
    addFavoriteAriaLabel: string;
    removeFavoriteAriaLabel: string;
    deleteLabel: string;
    editLabel: string;
    shareLabel: string;
    deleteConfirm: string;
    alerts: {
      loadFailed: string;
      authFailed: string;
      logoutFailed: string;
      deleteFailed: string;
      favoriteFailed: string;
      copySuccess: string;
      shareFailed: string;
    };
  };
  login: {
    title: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submitLabel: string;
    loadingLabel: string;
    requiredAlert: string;
    invalidCredentialsAlert: string;
  };
  signup: {
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submitLabel: string;
    loadingLabel: string;
    requiredError: string;
    creationFailedError: string;
    profileUpdateWarning: string;
  };
  favoriteHeader: {
    title: string;
    emptyMessage: string;
    countPrefix: string;
    countSuffix: string;
  };
  favoriteSearch: {
    placeholder: string;
  };
  favoriteSort: {
    newest: string;
    oldest: string;
    title: string;
  };
  favoriteViewToggle: {
    gridAriaLabel: string;
    listAriaLabel: string;
  };
  favoriteEmpty: {
    title: string;
    description: string;
  };
  favoriteCard: {
    summaryFallback: string;
    daySuffix: string;
    spotSuffix: string;
    removeFavoriteTitle: string;
  };
  myPageHeader: {
    title: string;
    emptyMessage: string;
    countPrefix: string;
    countSuffix: string;
  };
  myPageEmpty: {
    description: string;
    cta: string;
  };
  myPageCard: {
    summaryFallback: string;
    createdAtLabel: string;
    detailLabel: string;
    deleteLabel: string;
    backHomeLabel: string;
  };
  myPage: {
    loading: string;
    loadFailedAlert: string;
    authFailedAlert: string;
    deleteConfirm: string;
    deleteSuccessAlert: string;
    deleteFailedAlert: string;
  };
  myPageDetail: {
    invalidIdAlert: string;
    loadFailedAlert: string;
    authFailedAlert: string;
    loading: string;
    notFoundTitle: string;
    notFoundDescription: string;
    backToMyPage: string;
    backToMyPageWithArrow: string;
  };
  historyHeader: {
    title: string;
    emptyMessage: string;
    countPrefix: string;
    countSuffix: string;
  };
  historySearch: {
    placeholder: string;
  };
  historySort: {
    ariaLabel: string;
    newest: string;
    oldest: string;
  };
  historyViewToggle: {
    gridAriaLabel: string;
    listAriaLabel: string;
  };
  historyEmpty: {
    description: string;
    cta: string;
  };
  historyCard: {
    summaryFallback: string;
    openLabel: string;
    deleteLabel: string;
  };
  historyPage: {
    loading: string;
    loadFailedAlert: string;
    authFailedAlert: string;
    deleteConfirm: string;
    deleteFailedAlert: string;
  };
  historyDetail: {
    invalidIdAlert: string;
    loadFailedAlert: string;
    authFailedAlert: string;
    loading: string;
    notFoundTitle: string;
    backToDashboard: string;
  };
  historyEdit: {
    invalidIdAlert: string;
    loadFailedAlert: string;
    authFailedAlert: string;
    authChangedAlert: string;
    requiredAlert: string;
    titleTooLongAlert: string;
    summaryTooLongAlert: string;
    saveSuccessAlert: string;
    saveFailedAlert: string;
    title: string;
    loading: string;
    titleLabel: string;
    summaryLabel: string;
    savingLabel: string;
    saveLabel: string;
  };
  spotCard: {
    travelDetails: string;
    basicInformation: string;
    addressLabel: string;
    hoursLabel: string;
    priceLabel: string;
    areaLabel: string;
    spotInformation: string;
    aboutSpot: string;
    officialWebsiteAriaLabelSuffix: string;
    officialWebsiteLabel: string;
    mapPreview: string;
    location: string;
  };
  spotsPage: {
    eyebrow: string;
    title: string;
    description: string;
    countPrefix: string;
    countSuffix: string;
    areaPrefix: string;
    detailLink: string;
  };
  spotDetail: {
    backToSpots: string;
    namePrefix: string;
    metadataSeparator: string;
    ratingPrefix: string;
    ratingSuffix: string;
    addressPrefix: string;
    addressLabel: string;
    hoursPrefix: string;
    hoursLabel: string;
    pricePrefix: string;
    priceLabel: string;
    googleMapsLabel: string;
    officialWebsiteLabel: string;
  };
  placeLink: {
    unknownSpot: string;
    detailAriaLabelSuffix: string;
  };
  placeImage: {
    photoAltSuffix: string;
  };
  placeGallery: {
    title: string;
  };
  travelMap: {
    unavailableMessage: string;
    titlePrefix: string;
    titleSuffix: string;
  };
  globalLoading: {
    brandName: string;
    primaryMessage: string;
    secondaryMessage: string;
    searchingSpots: string;
    creatingRoute: string;
    finalizingPlan: string;
  };
  globalError: {
    title: string;
    description: string;
    retryMessage: string;
    retryButton: string;
  };
  notFound: {
    title: string;
    description: string;
    backToHome: string;
  };
  chatInput: {
    inputLabel: string;
    placeholder: string;
    sendingLabel: string;
    sendLabel: string;
  };
  chatMessages: {
    ariaLabel: string;
  };
  messageBubble: {
    userAriaLabel: string;
    assistantAriaLabel: string;
  };
  navbar: {
    home: string;
    aiTravel: string;
    history: string;
    favorites: string;
    myPage: string;
  };
  aboutPage: {
    metadata: {
      title: string;
      description: string;
    };
    title: string;
    mission: {
      title: string;
      description: string;
      benefit: string;
    };
    offer: {
      title: string;
      features: string[];
    };
    vision: {
      title: string;
      description: string;
      goal: string;
    };
  };
  contactPage: {
    metadata: { title: string; description: string };
    title: string;
    introduction: string;
    invitation: string;
    supportTitle: string;
    supportDescription: string;
    contactMethodTitle: string;
    contactMethodDescription: string;
    responseTimeTitle: string;
    responseTimeDescription: string;
  };
  privacyPage: {
    metadata: { title: string; description: string };
    title: string;
    informationTitle: string;
    informationDescription: string;
    useTitle: string;
    uses: string[];
    thirdPartyTitle: string;
    thirdPartyDescription: string;
    securityTitle: string;
    securityDescription: string;
    changesTitle: string;
    changesDescription: string;
    contactTitle: string;
    contactDescription: string;
  };
  termsPage: {
    metadata: { title: string; description: string };
    title: string;
    acceptanceTitle: string;
    acceptanceDescription: string;
    serviceTitle: string;
    serviceDescription: string;
    responsibilitiesTitle: string;
    responsibilities: string[];
    aiContentTitle: string;
    aiContentDescription: string;
    intellectualPropertyTitle: string;
    intellectualPropertyDescription: string;
    disclaimerTitle: string;
    disclaimerDescription: string;
    serviceChangesTitle: string;
    serviceChangesDescription: string;
    termsChangesTitle: string;
    termsChangesDescription: string;
  };
  siteMetadata: {
    defaultTitle: string;
    titleTemplate: string;
    description: string;
    keywords: string[];
    authorName: string;
    creator: string;
    applicationName: string;
    openGraphSiteName: string;
    openGraphTitle: string;
    openGraphDescription: string;
    openGraphImageAlt: string;
    twitterTitle: string;
    twitterDescription: string;
  };
  travelRouteMap: {
    title: string;
  };
};

export const messages: LocaleRecord<AppMessages> = {
  ja: {
    appName: "Japan Travel Buddy",
    languageName: "日本語",
    header: {
      tagline: "AIで日本を旅しよう",
      brandHomeLabel: "Japan Travel Buddy ホーム",
      navigationLabel: "メインナビゲーション",
      menu: {
        home: "ホーム",
        aiTrip: "AI旅行",
        favorites: "お気に入り",
        myPage: "マイページ",
      },
    },
    footer: {
      description:
        "AI-powered travel planner for exploring Japan. Plan smarter, travel easier.",
      links: {
        about: "About",
        contact: "Contact",
        privacyPolicy: "Privacy Policy",
        termsOfService: "Terms of Service",
      },
      rightsReserved: "All rights reserved.",
    },
    home: {
      badge: "AI Travel Planner",
      discoverPlaces: "行きたい場所を見つける",
      planWithAi: "AIで旅行プランを作る",
      regionSectionTitle: "旅したい地域を選ぶ",
      regionSectionDescription:
        "まずは地域を選んで、行きたい観光スポットを見つけましょう。",
      regionCardDescription:
        "観光スポットを見つけて、あなただけの旅を始めましょう。",
      exploreRegion: "スポットを見つける",
      featuredPlacesTitle: "おすすめスポット",
      featuredPlacesDescription:
        "人気の場所を少しだけご紹介します。気になるスポットの詳細を見てみましょう。",
      viewAllPlaces: "すべてのスポットを見る",
      hero: {
        title: "Discover Japan",
        titleAccent: "with AI",
        subtitleLead: "もっとスマートに、もっと自由に、",
        subtitleRest: "あなただけの理想の日本旅行を。",
        descriptionLead:
          "AIがあなたの希望に合わせて、 最適な旅行プランを自動で作成します。",
        descriptionRest:
          "まだ知らない日本の魅力を、 あなただけの旅で発見しましょう。",
        primaryCta: "AIで旅行プランを作成する",
        secondaryCta: "マイ旅行プラン",
      },
      features: {
        aiPowered: "AI Powered",
        kyotoSpots: "Kyoto Spots",
        googleMaps: "Google Maps",
        gpt: "GPT-5",
      },
      cards: {
        aiPlan: {
          title: "AI旅行プラン作成",
          description:
            "あなたの希望に合わせたオリジナル旅行プランを、AIが数秒で作成します。",
          linkLabel: "プランを作成する",
        },
        map: {
          title: "観光スポットを探す",
          description:
            "地域を選び、行きたい観光スポットを見つけてから旅行プランを作れます。",
          linkLabel: "地域を選ぶ",
        },
        save: {
          title: "旅行プランを保存",
          description:
            "お気に入りの旅行プランを保存して、いつでもどこでも確認できます。",
          linkLabel: "マイプランを見る",
        },
      },
    },
    travelForm: {
      title: "AI旅行プラン作成",
      description:
        "行き先や旅行条件を入力すると、AIが希望に合わせたプランを作成します。",
      requiredLabel: "必須項目：",
      requiredItems: "行き先・日数・人数",
      selectPlaceholder: "選択してください",
      destination: {
        label: "行き先",
        placeholder: "例：京都、東京、大阪",
        help: "都道府県、市区町村、観光エリアなどを入力してください。",
      },
      days: {
        label: "日数",
        unit: "日",
      },
      travelers: {
        label: "人数",
        unit: "人",
      },
      budget: {
        label: "旅行全体の予算",
        optionLabels: [
          "指定なし",
          "10,000円",
          "30,000円",
          "50,000円",
          "100,000円",
          "150,000円",
          "200,000円以上",
        ],
      },
      interests: {
        label: "興味・旅行テーマ",
        multipleSelection: "複数選択可",
        selectedSuffix: "件選択",
        clearAll: "すべて解除",
        optionLabels: [
          "🏯 神社・お寺",
          "🍣 グルメ",
          "☕ カフェ",
          "🌿 自然",
          "♨️ 温泉",
          "🛍️ ショッピング",
          "🎌 アニメ・ゲーム",
          "🌃 夜景",
          "👨‍👩‍👧‍👦 家族向け",
          "💎 穴場スポット",
        ],
      },
      specialRequest: {
        label: "その他のご希望",
        optional: "任意",
        placeholder:
          "例：\n・抹茶スイーツを食べたい\n・人混みを避けたい\n・雨でも楽しめる場所がいい\n・歩く距離を少なくしたい",
        help: "食べたいもの、避けたい場所、移動方法、体力面の希望などを自由に入力できます。",
      },
      advancedConditions: {
        label: "詳細条件",
        description:
          "開始地点や開始時刻、旅行後の到着地点・時刻が決まっている場合に入力できます。",
      },
      startLocation: {
        label: "開始地点",
        placeholder: "例：京都駅、Hotel Granvia Kyoto",
      },
      startTime: {
        label: "開始時刻",
      },
      endLocation: {
        label: "終了地点",
        placeholder: "例：ホテル、京都駅、新大阪駅",
      },
      endTime: {
        label: "終了希望時刻",
      },
      submit: {
        idle: "✨ AIで旅行プランを作成",
        loading: "AIが旅行プランを作成中...",
        incomplete: "行き先・日数・人数を入力すると作成できます。",
        loadingStatus: "条件を確認し、旅行ルートを組み立てています。",
      },
    },
    chatPage: {
      badge: "AI Travel Planner",
      title: "AI旅行プランナー",
      description:
        "行き先や日数、興味を入力すると、AIがあなた専用の旅行プランを作成します。",
      plannerLabel: "Planner",
      plannerStatus: "AIが自動作成",
      locationLabel: "Location",
      locationReady: "現在地を取得済み",
      locationLoading: "現在地を確認中",
      formTitle: "旅行条件を入力",
      formDescription: "分かる範囲だけ入力すれば、残りはAIが提案します。",
      errorMessage:
        "旅行プランの作成中にエラーが発生しました。時間を置いて、もう一度お試しください。",
    },
    travelPlanHeader: {
      imageAlt: "京都の旅行風景",
      description:
        "京都の人気スポットを効率よく巡る、AIが作成した旅行プランです。 観光、移動、滞在時間をまとめて確認できます。",
      info: {
        durationLabel: "Duration",
        durationValue: "3 Days",
        spotsLabel: "Spots",
        spotsValue: "12 Spots",
        areaLabel: "Area",
        areaValue: "Kyoto",
        planLabel: "Plan",
        planValue: "AI Generated",
      },
    },
    travelTimeline: {
      brandLabel: "JAPAN TRAVEL BUDDY",
      dayPrefix: "Day ",
      daySuffix: "",
      spotCountSuffix: "スポット",
      emptyMessage: "この日の旅行プランはありません。",
      unknownSpot: "不明なスポット",
    },
    timelineItem: {
      descriptionFallback: "説明はありません。",
      transport: {
        walking: "徒歩",
        jr: "JR",
        train: "電車",
        subway: "地下鉄",
        bus: "バス",
        taxi: "タクシー",
      },
    },
    timelineMapButton: {
      label: "Google Maps",
      ariaLabelPrefix: "",
      ariaLabelSuffix: "をGoogle Mapsで開く",
    },
    travelPlanCard: {
      actions: {
        addFavorite: "お気に入りに追加",
        removeFavorite: "お気に入りから削除",
        favoriteTitle: "お気に入り",
        copy: "旅行プランをコピー",
        copyTitle: "コピー",
        savePdf: "旅行プランをPDFで保存",
        savePdfTitle: "PDF保存",
        save: "旅行プランを保存",
        saveTitle: "保存",
        saving: "保存中...",
        openRoute: "Google Mapsでルートを開く",
        mapsTitle: "Google Maps",
        share: "旅行プランを共有",
        shareTitle: "共有",
      },
      routeSegments: {
        title: "区間別Google Mapsルート",
        description: "開きたい区間を選択してください。",
        fromLabel: "出発地点",
        toLabel: "到着地点",
        walking: "徒歩",
        transit: "公共交通",
        automatic: "Google Mapsで自動判定",
        open: "Google Mapsで開く",
        close: "区間ルートを閉じる",
      },
      alerts: {
        copySuccess: "旅行プランをコピーしました。",
        copyFailed: "コピーに失敗しました。",
        pdfFailed: "PDFを作成できませんでした。",
        loginRequired: "ログインしてください。",
        invalidPlan: "旅行プランの内容が不正なため保存できませんでした。",
        authChanged: "認証状態が変更されました。もう一度ログインしてください。",
        saveSuccess: "旅行プランを保存しました。",
        saveFailed: "旅行プランを保存できませんでした。",
        shareUnavailable: "共有できませんでした。",
        shareCopySuccess: "共有用の旅行プランをコピーしました。",
        shareFailed: "共有に失敗しました。",
        noRouteSpots: "ルートを作成できるスポットがありません。",
        mapsFailed: "Googleマップを開けませんでした。",
      },
      info: {
        durationLabel: "Duration",
        daySuffix: "日間",
        spotsLabel: "Spots",
        spotSuffix: "スポット",
        areaLabel: "Area",
        defaultArea: "日本",
        aiLabel: "AI",
        aiValue: "Concierge",
      },
      summaryEyebrow: "Travel Summary",
      summaryTitle: "プラン概要",
      mapEyebrow: "Travel Map",
      mapTitle: "旅行ルート",
    },
    favoriteButton: {
      saveAriaLabel: "お気に入りに保存",
      savedAriaLabel: "お気に入りに保存しました",
      favoriteLabel: "お気に入り",
      savedLabel: "保存しました",
    },
    copyButton: {
      copyAriaLabel: "旅行プランをコピー",
      copiedAriaLabel: "旅行プランをコピーしました",
      copyLabel: "コピー",
      copiedLabel: "コピーしました",
    },
    pdfButton: {
      creatingAriaLabel: "旅行プランのPDFを作成中",
      completedAriaLabel: "旅行プランをPDFで保存しました",
      saveAriaLabel: "旅行プランをPDFで保存",
      creatingLabel: "PDF作成中",
      savedLabel: "保存しました",
      saveLabel: "PDF保存",
      completedStatus: "PDF保存完了",
    },
    shareButton: {
      copiedAlert: "URLをコピーしました！",
      label: "共有",
    },
    travelPlanSkeleton: {
      ariaLabel: "AIが旅行プランを作成しています",
      badge: "AI Travel Planner",
      title: "AIが旅行プランを作成しています",
      description:
        "ご希望に合うスポットや移動順を確認しながら、 あなただけの旅行プランを組み立てています。",
      preparingLabel: "プランを準備中",
      waitMessage:
        "内容によっては少し時間がかかる場合があります。 このままお待ちください。",
      steps: [
        {
          label: "旅行条件を確認",
          description: "行き先やご希望を整理しています",
        },
        {
          label: "観光スポットを選定",
          description: "条件に合う場所を探しています",
        },
        {
          label: "移動ルートを調整",
          description: "無理のない順番を組み立てています",
        },
        {
          label: "旅行プランを仕上げ",
          description: "読みやすい日程にまとめています",
        },
      ],
    },
    interactiveTravelMap: {
      unavailableTitle: "地図を表示できません",
      missingApiKeyMessage: "Google Maps API Keyが設定されていません。",
      mapAriaLabel: "旅行スポットのルートマップ",
      openGoogleMaps: "Google Mapsで開く",
      spotCountSuffix: "スポット",
    },
    dashboard: {
      title: "マイページ",
      logout: "ログアウト",
      loggingOut: "ログアウト中...",
      welcomeSuffix: " へようこそ！",
      savedPlansTitle: "📚 保存済み旅行プラン",
      showAll: "📚 すべて表示",
      favoritesOnly: "⭐ お気に入りのみ",
      searchPlaceholder: "旅行プランを検索...",
      emptyMessage: "保存された旅行プランはありません。",
      createdAtLabel: "作成日：",
      addFavoriteAriaLabel: "お気に入りに追加",
      removeFavoriteAriaLabel: "お気に入りから削除",
      deleteLabel: "🗑 削除",
      editLabel: "✏️ 編集",
      shareLabel: "📤 共有",
      deleteConfirm: "この旅行プランを削除しますか？",
      alerts: {
        loadFailed: "旅行プランを読み込めませんでした。",
        authFailed:
          "認証状態を確認できませんでした。ページを再読み込みしてください。",
        logoutFailed: "ログアウトできませんでした。もう一度お試しください。",
        deleteFailed: "旅行プランを削除できませんでした。",
        favoriteFailed: "お気に入りを更新できませんでした。",
        copySuccess: "旅行プランをコピーしました。",
        shareFailed: "共有できませんでした。",
      },
    },
    login: {
      title: "ログイン",
      emailLabel: "メールアドレス",
      emailPlaceholder: "メールアドレスを入力",
      passwordLabel: "パスワード",
      passwordPlaceholder: "パスワードを入力",
      submitLabel: "ログイン",
      loadingLabel: "ログイン中...",
      requiredAlert: "メールアドレスとパスワードを入力してください。",
      invalidCredentialsAlert:
        "メールアドレスまたはパスワードが正しくありません。",
    },
    signup: {
      title: "Create Account",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "Your email",
      passwordLabel: "Password",
      passwordPlaceholder: "Password",
      submitLabel: "Create Account",
      loadingLabel: "Creating...",
      requiredError:
        "表示名、メールアドレス、パスワードを入力してください。",
      creationFailedError:
        "アカウントを作成できませんでした。入力内容を確認して、もう一度お試しください。",
      profileUpdateWarning:
        "アカウントは作成されましたが、表示名を設定できませんでした。そのままサービスを利用できます。",
    },
    favoriteHeader: {
      title: "お気に入り",
      emptyMessage: "保存した旅行プランはありません",
      countPrefix: "保存した旅行プランは ",
      countSuffix: " 件あります",
    },
    favoriteSearch: {
      placeholder: "旅行プランを検索...",
    },
    favoriteSort: {
      newest: "新しい順",
      oldest: "古い順",
      title: "タイトル順",
    },
    favoriteViewToggle: {
      gridAriaLabel: "グリッド表示",
      listAriaLabel: "リスト表示",
    },
    favoriteEmpty: {
      title: "お気に入りはまだありません",
      description:
        "気に入った旅行プランを保存すると、 ここからいつでも見返すことができます。",
    },
    favoriteCard: {
      summaryFallback: "旅行プランの概要はありません。",
      daySuffix: "日間",
      spotSuffix: "スポット",
      removeFavoriteTitle: "お気に入り解除",
    },
    myPageHeader: {
      title: "マイ旅行プラン",
      emptyMessage: "保存した旅行プランはありません",
      countPrefix: "保存件数：",
      countSuffix: "件",
    },
    myPageEmpty: {
      description: "保存された旅行プランはありません。",
      cta: "AIで旅行プランを作成する",
    },
    myPageCard: {
      summaryFallback: "旅行プランの概要はありません。",
      createdAtLabel: "作成日：",
      detailLabel: "詳細を見る",
      deleteLabel: "削除",
      backHomeLabel: "ホームへ戻る",
    },
    myPage: {
      loading: "読み込み中...",
      loadFailedAlert: "保存済み旅行プランを読み込めませんでした。",
      authFailedAlert:
        "認証状態を確認できませんでした。ページを再読み込みしてください。",
      deleteConfirm: "この旅行プランを削除しますか？",
      deleteSuccessAlert: "削除しました。",
      deleteFailedAlert: "旅行プランを削除できませんでした。",
    },
    myPageDetail: {
      invalidIdAlert: "旅行プランのIDが不正です。",
      loadFailedAlert: "旅行プランを読み込めませんでした。",
      authFailedAlert:
        "認証状態を確認できませんでした。ページを再読み込みしてください。",
      loading: "読み込み中...",
      notFoundTitle: "プランが見つかりません",
      notFoundDescription:
        "この旅行プランは削除されたか、 存在しない可能性があります。",
      backToMyPage: "マイページへ戻る",
      backToMyPageWithArrow: "← マイページへ戻る",
    },
    historyHeader: {
      title: "保存した旅行プラン",
      emptyMessage: "保存した旅行プランはありません",
      countPrefix: "保存件数：",
      countSuffix: "件",
    },
    historySearch: {
      placeholder: "旅行プランを検索...",
    },
    historySort: {
      ariaLabel: "並び順",
      newest: "新しい順",
      oldest: "古い順",
    },
    historyViewToggle: {
      gridAriaLabel: "グリッド表示",
      listAriaLabel: "リスト表示",
    },
    historyEmpty: {
      description: "保存された旅行プランはありません。",
      cta: "AIで旅行プランを作成する",
    },
    historyCard: {
      summaryFallback: "旅行プランの概要はありません。",
      openLabel: "開く",
      deleteLabel: "削除",
    },
    historyPage: {
      loading: "読み込み中...",
      loadFailedAlert: "旅行履歴を読み込めませんでした。",
      authFailedAlert:
        "認証状態を確認できませんでした。ページを再読み込みしてください。",
      deleteConfirm: "この旅行プランを削除しますか？",
      deleteFailedAlert: "旅行プランを削除できませんでした。",
    },
    historyDetail: {
      invalidIdAlert: "旅行プランのIDが不正です。",
      loadFailedAlert: "旅行プランを読み込めませんでした。",
      authFailedAlert:
        "認証状態を確認できませんでした。ページを再読み込みしてください。",
      loading: "読み込み中...",
      notFoundTitle: "旅行プランが見つかりません",
      backToDashboard: "← Dashboardへ戻る",
    },
    historyEdit: {
      invalidIdAlert: "旅行プランのIDが不正です。",
      loadFailedAlert: "旅行プランを読み込めませんでした。",
      authFailedAlert:
        "認証状態を確認できませんでした。ページを再読み込みしてください。",
      authChangedAlert: "認証状態が変更されました。もう一度ログインしてください。",
      requiredAlert: "タイトルと概要を入力してください。",
      titleTooLongAlert: "タイトルは120文字以内で入力してください。",
      summaryTooLongAlert: "概要は2000文字以内で入力してください。",
      saveSuccessAlert: "保存しました",
      saveFailedAlert: "旅行プランを保存できませんでした。",
      title: "✏️ 旅行プラン編集",
      loading: "読み込み中...",
      titleLabel: "タイトル",
      summaryLabel: "概要",
      savingLabel: "保存中...",
      saveLabel: "💾 保存",
    },
    spotCard: {
      travelDetails: "Travel Details",
      basicInformation: "基本情報",
      addressLabel: "Address",
      hoursLabel: "Hours",
      priceLabel: "Price",
      areaLabel: "Area",
      spotInformation: "Spot Information",
      aboutSpot: "このスポットについて",
      officialWebsiteAriaLabelSuffix: "の公式サイトを新しいタブで開く",
      officialWebsiteLabel: "公式サイトを見る",
      mapPreview: "Map Preview",
      location: "所在地",
    },
    spotsPage: {
      eyebrow: "KYOTO SPOT DATABASE",
      title: "京都スポット一覧",
      description: "京都の観光スポットを一覧から探せます。",
      countPrefix: "全 ",
      countSuffix: " スポット",
      areaPrefix: "📍 ",
      detailLink: "詳細を見る →",
    },
    spotDetail: {
      backToSpots: "← スポット一覧へ戻る",
      namePrefix: "📍 ",
      metadataSeparator: " ・ ",
      ratingPrefix: "⭐ ",
      ratingSuffix: " / 5",
      addressPrefix: "📍 ",
      addressLabel: "住所：",
      hoursPrefix: "🕒 ",
      hoursLabel: "営業時間：",
      pricePrefix: "💴 ",
      priceLabel: "入場料：",
      googleMapsLabel: "🗺 Google Maps",
      officialWebsiteLabel: "🌐 公式サイト",
    },
    placeLink: {
      unknownSpot: "不明なスポット",
      detailAriaLabelSuffix: "の詳細ページを見る",
    },
    placeImage: {
      photoAltSuffix: "の写真",
    },
    placeGallery: {
      title: "📸 観光スポット",
    },
    travelMap: {
      unavailableMessage: "地図を表示できません。",
      titlePrefix: "",
      titleSuffix: "の地図",
    },
    globalLoading: {
      brandName: "Japan Travel Buddy",
      primaryMessage: "Creating your perfect Japan journey...",
      secondaryMessage: "Our AI is planning the best route for you.",
      searchingSpots: "🤖 おすすめスポットを検索中...",
      creatingRoute: "🗺️ 最適なルートを作成中...",
      finalizingPlan: "✨ 旅行プランを仕上げています...",
    },
    globalError: {
      title: "Something went wrong",
      description: "An unexpected error occurred.",
      retryMessage: "Please try again.",
      retryButton: "Try Again",
    },
    notFound: {
      title: "Page Not Found",
      description: "Sorry, the page you are looking for does not exist.",
      backToHome: "Back to Home",
    },
    chatInput: {
      inputLabel: "メッセージ入力",
      placeholder: "京都を3日旅行したい",
      sendingLabel: "送信中...",
      sendLabel: "送信",
    },
    chatMessages: {
      ariaLabel: "チャットメッセージ",
    },
    messageBubble: {
      userAriaLabel: "ユーザーのメッセージ",
      assistantAriaLabel: "AIのメッセージ",
    },
    navbar: {
      home: "🏠 ホーム",
      aiTravel: "🤖 AI旅行",
      history: "📚 履歴",
      favorites: "⭐ お気に入り",
      myPage: "👤 マイページ",
    },
    aboutPage: {
      metadata: {
        title: "About | Japan Travel Buddy",
        description: "Learn more about Japan Travel Buddy",
      },
      title: "About Japan Travel Buddy",
      mission: {
        title: "Our Mission",
        description:
          "Japan Travel Buddy was created to make traveling in Japan easier, more enjoyable, and more personal through the power of AI.",
        benefit:
          "Instead of spending hours researching destinations, transportation, and itineraries, travelers can receive personalized travel plans in seconds.",
      },
      offer: {
        title: "What We Offer",
        features: [
          "AI-powered travel itinerary generation",
          "Curated sightseeing spot database",
          "Interactive maps",
          "Favorite travel plans",
          "PDF export",
          "Responsive experience across devices",
        ],
      },
      vision: {
        title: "Our Vision",
        description:
          "We aim to become the most trusted AI travel companion for visitors exploring Japan.",
        goal:
          "Our goal is to continuously improve the service by expanding destination coverage, enhancing AI recommendations, and delivering a better travel experience for every user.",
      },
    },
    contactPage: {
      metadata: { title: "Contact | Japan Travel Buddy", description: "Contact Japan Travel Buddy" },
      title: "Contact",
      introduction: "Thank you for using Japan Travel Buddy.",
      invitation: "If you have any questions, feedback, or suggestions, please feel free to contact us.",
      supportTitle: "Support",
      supportDescription: "We welcome bug reports, feature requests, and general inquiries.",
      contactMethodTitle: "Contact Method",
      contactMethodDescription: "Contact information will be available here before the official release.",
      responseTimeTitle: "Response Time",
      responseTimeDescription: "We aim to respond to inquiries as quickly as possible. Response times may vary depending on the volume of requests.",
    },
    privacyPage: {
      metadata: { title: "Privacy Policy | Japan Travel Buddy", description: "Privacy Policy for Japan Travel Buddy" },
      title: "Privacy Policy",
      informationTitle: "1. Information We Collect",
      informationDescription: "Japan Travel Buddy may collect information necessary to provide travel planning services, including your account information, travel preferences, and usage data.",
      useTitle: "2. How We Use Your Information",
      uses: ["Generate AI travel plans", "Save your favorite plans", "Improve the quality of our service", "Provide customer support"],
      thirdPartyTitle: "3. Third-Party Services",
      thirdPartyDescription: "This service uses third-party services including Firebase, OpenAI, and Google Maps Platform. These services may process information in accordance with their own privacy policies.",
      securityTitle: "4. Data Security",
      securityDescription: "We take reasonable measures to protect your information from unauthorized access, disclosure, alteration, or destruction.",
      changesTitle: "5. Changes to This Policy",
      changesDescription: "This Privacy Policy may be updated from time to time. The latest version will always be available on this page.",
      contactTitle: "6. Contact",
      contactDescription: "If you have any questions regarding this Privacy Policy, please contact us through the Contact page.",
    },
    termsPage: {
      metadata: { title: "Terms of Service | Japan Travel Buddy", description: "Terms of Service for Japan Travel Buddy" },
      title: "Terms of Service",
      acceptanceTitle: "1. Acceptance of Terms",
      acceptanceDescription: "By using Japan Travel Buddy, you agree to these Terms of Service.",
      serviceTitle: "2. Service Description",
      serviceDescription: "Japan Travel Buddy provides AI-powered travel planning tools, destination information, maps, and related features to assist users in planning trips within Japan.",
      responsibilitiesTitle: "3. User Responsibilities",
      responsibilities: ["Provide accurate account information.", "Use the service lawfully.", "Do not interfere with the operation of the service.", "Do not attempt unauthorized access."],
      aiContentTitle: "4. AI-Generated Content",
      aiContentDescription: "Travel plans are generated using AI and may contain inaccuracies. Users are responsible for verifying information such as opening hours, prices, transportation schedules, and reservation requirements before traveling.",
      intellectualPropertyTitle: "5. Intellectual Property",
      intellectualPropertyDescription: "The content, design, and software of Japan Travel Buddy are protected by applicable intellectual property laws unless otherwise stated.",
      disclaimerTitle: "6. Disclaimer",
      disclaimerDescription: "We do not guarantee that the service will always be uninterrupted, error-free, or suitable for every purpose. Use of the service is at your own discretion.",
      serviceChangesTitle: "7. Changes to the Service",
      serviceChangesDescription: "We may modify, suspend, or discontinue parts of the service at any time without prior notice.",
      termsChangesTitle: "8. Changes to These Terms",
      termsChangesDescription: "These Terms of Service may be updated from time to time. The latest version will always be available on this page.",
    },
    siteMetadata: {
      defaultTitle: "Japan Travel Buddy",
      titleTemplate: "%s | Japan Travel Buddy",
      description: "Plan your perfect trip to Japan with AI. Discover destinations, build personalized itineraries, explore interactive maps, and save your travel plans with Japan Travel Buddy.",
      keywords: ["Japan", "Travel", "Kyoto", "AI", "Travel Planner", "Japan Trip", "Itinerary", "Tourism", "OpenAI"],
      authorName: "Japan Travel Buddy",
      creator: "Japan Travel Buddy",
      applicationName: "Japan Travel Buddy",
      openGraphSiteName: "Japan Travel Buddy",
      openGraphTitle: "Japan Travel Buddy",
      openGraphDescription: "Create personalized Japan travel plans with AI.",
      openGraphImageAlt: "Japan Travel Buddy",
      twitterTitle: "Japan Travel Buddy",
      twitterDescription: "Create personalized Japan travel plans with AI.",
    },
    travelRouteMap: {
      title: "🗺️ Travel Route Map",
    },
  },
  en: {
    appName: "Japan Travel Buddy",
    languageName: "English",
    header: {
      tagline: "Travel Japan with AI",
      brandHomeLabel: "Japan Travel Buddy home",
      navigationLabel: "Main navigation",
      menu: {
        home: "Home",
        aiTrip: "AI Trip",
        favorites: "Favorites",
        myPage: "My Page",
      },
    },
    footer: {
      description:
        "AI-powered travel planner for exploring Japan. Plan smarter, travel easier.",
      links: {
        about: "About",
        contact: "Contact",
        privacyPolicy: "Privacy Policy",
        termsOfService: "Terms of Service",
      },
      rightsReserved: "All rights reserved.",
    },
    home: {
      badge: "AI Travel Planner",
      discoverPlaces: "Discover places",
      planWithAi: "Let AI plan your trip",
      regionSectionTitle: "Choose where to explore",
      regionSectionDescription:
        "Choose a region first, then find the places you want to visit.",
      regionCardDescription:
        "Discover sightseeing spots and start building a trip that is yours.",
      exploreRegion: "Explore places",
      featuredPlacesTitle: "Recommended places",
      featuredPlacesDescription:
        "Explore a few popular places and open any spot to learn more.",
      viewAllPlaces: "View all places",
      hero: {
        title: "Discover Japan",
        titleAccent: "with AI",
        subtitleLead: "Travel smarter and more freely,",
        subtitleRest: "with your ideal trip to Japan.",
        descriptionLead:
          "AI creates the perfect travel plan tailored to your preferences.",
        descriptionRest:
          "Discover a new side of Japan on a journey designed just for you.",
        primaryCta: "Create an AI Travel Plan",
        secondaryCta: "My Travel Plans",
      },
      features: {
        aiPowered: "AI Powered",
        kyotoSpots: "Kyoto Spots",
        googleMaps: "Google Maps",
        gpt: "GPT-5",
      },
      cards: {
        aiPlan: {
          title: "AI Travel Planning",
          description:
            "AI creates a personalized travel plan based on your preferences in seconds.",
          linkLabel: "Create a Plan",
        },
        map: {
          title: "Discover Places",
          description:
            "Choose a region, discover places you want to visit, and then create your travel plan.",
          linkLabel: "Choose a Region",
        },
        save: {
          title: "Save Travel Plans",
          description:
            "Save your favorite travel plans and access them anytime, anywhere.",
          linkLabel: "View My Plans",
        },
      },
    },
    travelForm: {
      title: "Create an AI Travel Plan",
      description:
        "Enter your destination and travel preferences, and AI will create a personalized plan for you.",
      requiredLabel: "Required: ",
      requiredItems: "Destination, days, and travelers",
      selectPlaceholder: "Select an option",
      destination: {
        label: "Destination",
        placeholder: "e.g. Kyoto, Tokyo, or Osaka",
        help: "Enter a prefecture, city, town, or sightseeing area.",
      },
      days: {
        label: "Days",
        unit: " days",
      },
      travelers: {
        label: "Travelers",
        unit: " travelers",
      },
      budget: {
        label: "Total Trip Budget",
        optionLabels: [
          "No preference",
          "¥10,000",
          "¥30,000",
          "¥50,000",
          "¥100,000",
          "¥150,000",
          "¥200,000 or more",
        ],
      },
      interests: {
        label: "Interests & Travel Style",
        multipleSelection: "Select all that apply",
        selectedSuffix: " selected",
        clearAll: "Clear all",
        optionLabels: [
          "🏯 Shrines & Temples",
          "🍣 Food",
          "☕ Cafés",
          "🌿 Nature",
          "♨️ Hot Springs",
          "🛍️ Shopping",
          "🎌 Anime & Games",
          "🌃 Night Views",
          "👨‍👩‍👧‍👦 Family-friendly",
          "💎 Hidden Gems",
        ],
      },
      specialRequest: {
        label: "Additional Requests",
        optional: "Optional",
        placeholder:
          "e.g.\n• I want to try matcha sweets\n• I prefer to avoid crowds\n• I want places to enjoy on rainy days\n• I prefer shorter walking distances",
        help: "Share any preferences for food, places to avoid, transportation, accessibility, or pace.",
      },
      advancedConditions: {
        label: "Advanced conditions",
        description:
          "Add a start point, start time, end point, or preferred end time when you already know them.",
      },
      startLocation: {
        label: "Start location",
        placeholder: "e.g. Kyoto Station, Hotel Granvia Kyoto",
      },
      startTime: {
        label: "Start time",
      },
      endLocation: {
        label: "End location",
        placeholder: "e.g. Hotel, Kyoto Station, Shin-Osaka Station",
      },
      endTime: {
        label: "End time",
      },
      submit: {
        idle: "✨ Create an AI Travel Plan",
        loading: "AI is creating your travel plan...",
        incomplete: "Enter a destination, number of days, and travelers to continue.",
        loadingStatus: "Reviewing your preferences and building your itinerary.",
      },
    },
    chatPage: {
      badge: "AI Travel Planner",
      title: "AI Travel Planner",
      description:
        "Enter your destination, trip length, and interests, and AI will create a personalized travel plan for you.",
      plannerLabel: "Planner",
      plannerStatus: "Created automatically by AI",
      locationLabel: "Location",
      locationReady: "Current location found",
      locationLoading: "Checking current location",
      formTitle: "Enter Your Travel Preferences",
      formDescription:
        "Fill in what you know, and AI will suggest the rest.",
      errorMessage:
        "Something went wrong while creating your travel plan. Please wait a moment and try again.",
    },
    travelPlanHeader: {
      imageAlt: "Travel scenery in Kyoto",
      description:
        "An AI-generated travel plan for exploring Kyoto's popular attractions efficiently. Review sightseeing stops, transportation, and recommended visit times in one place.",
      info: {
        durationLabel: "Duration",
        durationValue: "3 Days",
        spotsLabel: "Spots",
        spotsValue: "12 Spots",
        areaLabel: "Area",
        areaValue: "Kyoto",
        planLabel: "Plan",
        planValue: "AI Generated",
      },
    },
    travelTimeline: {
      brandLabel: "JAPAN TRAVEL BUDDY",
      dayPrefix: "Day ",
      daySuffix: "",
      spotCountSuffix: " spots",
      emptyMessage: "No activities are planned for this day.",
      unknownSpot: "Unknown spot",
    },
    timelineItem: {
      descriptionFallback: "No description is available.",
      transport: {
        walking: "Walk",
        jr: "JR",
        train: "Train",
        subway: "Subway",
        bus: "Bus",
        taxi: "Taxi",
      },
    },
    timelineMapButton: {
      label: "Google Maps",
      ariaLabelPrefix: "Open ",
      ariaLabelSuffix: " in Google Maps",
    },
    travelPlanCard: {
      actions: {
        addFavorite: "Add to favorites",
        removeFavorite: "Remove from favorites",
        favoriteTitle: "Favorites",
        copy: "Copy travel plan",
        copyTitle: "Copy",
        savePdf: "Save travel plan as PDF",
        savePdfTitle: "Save PDF",
        save: "Save travel plan",
        saveTitle: "Save",
        saving: "Saving...",
        openRoute: "Open route in Google Maps",
        mapsTitle: "Google Maps",
        share: "Share travel plan",
        shareTitle: "Share",
      },
      routeSegments: {
        title: "Google Maps route segments",
        description: "Choose a segment to open.",
        fromLabel: "From",
        toLabel: "To",
        walking: "Walking",
        transit: "Transit",
        automatic: "Let Google Maps choose",
        open: "Open in Google Maps",
        close: "Close route segments",
      },
      alerts: {
        copySuccess: "Travel plan copied.",
        copyFailed: "Failed to copy the travel plan.",
        pdfFailed: "Could not create the PDF.",
        loginRequired: "Please log in.",
        invalidPlan: "This travel plan is invalid and could not be saved.",
        authChanged: "Your session has changed. Please log in again.",
        saveSuccess: "Travel plan saved.",
        saveFailed: "Could not save the travel plan.",
        shareUnavailable: "Could not share the travel plan.",
        shareCopySuccess: "A copy of the travel plan was created for sharing.",
        shareFailed: "Failed to share the travel plan.",
        noRouteSpots: "There are no spots available for creating a route.",
        mapsFailed: "Could not open Google Maps.",
      },
      info: {
        durationLabel: "Duration",
        daySuffix: " days",
        spotsLabel: "Spots",
        spotSuffix: " spots",
        areaLabel: "Area",
        defaultArea: "Japan",
        aiLabel: "AI",
        aiValue: "Concierge",
      },
      summaryEyebrow: "Travel Summary",
      summaryTitle: "Plan Summary",
      mapEyebrow: "Travel Map",
      mapTitle: "Travel Route",
    },
    favoriteButton: {
      saveAriaLabel: "Save to favorites",
      savedAriaLabel: "Saved to favorites",
      favoriteLabel: "Favorites",
      savedLabel: "Saved",
    },
    copyButton: {
      copyAriaLabel: "Copy travel plan",
      copiedAriaLabel: "Travel plan copied",
      copyLabel: "Copy",
      copiedLabel: "Copied",
    },
    pdfButton: {
      creatingAriaLabel: "Creating travel plan PDF",
      completedAriaLabel: "Travel plan saved as PDF",
      saveAriaLabel: "Save travel plan as PDF",
      creatingLabel: "Creating PDF",
      savedLabel: "Saved",
      saveLabel: "Save PDF",
      completedStatus: "PDF saved",
    },
    shareButton: {
      copiedAlert: "URL copied!",
      label: "Share",
    },
    travelPlanSkeleton: {
      ariaLabel: "AI is creating your travel plan",
      badge: "AI Travel Planner",
      title: "AI is creating your travel plan",
      description:
        "We are reviewing matching spots and the best travel order to build a personalized travel plan for you.",
      preparingLabel: "Preparing your plan",
      waitMessage:
        "Some plans may take a little longer to create. Please wait a moment.",
      steps: [
        {
          label: "Reviewing your preferences",
          description: "Organizing your destination and requests",
        },
        {
          label: "Selecting attractions",
          description: "Finding places that match your preferences",
        },
        {
          label: "Planning your route",
          description: "Arranging a comfortable travel order",
        },
        {
          label: "Finalizing your plan",
          description: "Putting everything into an easy-to-read itinerary",
        },
      ],
    },
    interactiveTravelMap: {
      unavailableTitle: "Map unavailable",
      missingApiKeyMessage: "The Google Maps API key is not configured.",
      mapAriaLabel: "Travel spot route map",
      openGoogleMaps: "Open in Google Maps",
      spotCountSuffix: " spots",
    },
    dashboard: {
      title: "My Page",
      logout: "Log Out",
      loggingOut: "Logging out...",
      welcomeSuffix: ", welcome!",
      savedPlansTitle: "📚 Saved Travel Plans",
      showAll: "📚 Show All",
      favoritesOnly: "⭐ Favorites Only",
      searchPlaceholder: "Search travel plans...",
      emptyMessage: "You have no saved travel plans.",
      createdAtLabel: "Created: ",
      addFavoriteAriaLabel: "Add to favorites",
      removeFavoriteAriaLabel: "Remove from favorites",
      deleteLabel: "🗑 Delete",
      editLabel: "✏️ Edit",
      shareLabel: "📤 Share",
      deleteConfirm: "Delete this travel plan?",
      alerts: {
        loadFailed: "Could not load your travel plans.",
        authFailed:
          "Could not verify your authentication status. Please reload the page.",
        logoutFailed: "Could not log out. Please try again.",
        deleteFailed: "Could not delete the travel plan.",
        favoriteFailed: "Could not update the favorite.",
        copySuccess: "Travel plan copied.",
        shareFailed: "Could not share the travel plan.",
      },
    },
    login: {
      title: "Log In",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email address",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      submitLabel: "Log In",
      loadingLabel: "Logging in...",
      requiredAlert: "Enter your email address and password.",
      invalidCredentialsAlert: "The email address or password is incorrect.",
    },
    signup: {
      title: "Create Account",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "Your email",
      passwordLabel: "Password",
      passwordPlaceholder: "Password",
      submitLabel: "Create Account",
      loadingLabel: "Creating...",
      requiredError: "Enter your name, email address, and password.",
      creationFailedError:
        "Could not create your account. Check your information and try again.",
      profileUpdateWarning:
        "Your account was created, but your display name could not be set. You can continue using the service.",
    },
    favoriteHeader: {
      title: "Favorites",
      emptyMessage: "You have no saved travel plans",
      countPrefix: "You have ",
      countSuffix: " saved travel plans",
    },
    favoriteSearch: {
      placeholder: "Search travel plans...",
    },
    favoriteSort: {
      newest: "Newest First",
      oldest: "Oldest First",
      title: "Title",
    },
    favoriteViewToggle: {
      gridAriaLabel: "Grid view",
      listAriaLabel: "List view",
    },
    favoriteEmpty: {
      title: "No favorites yet",
      description:
        "Save travel plans you like, and you can revisit them here anytime.",
    },
    favoriteCard: {
      summaryFallback: "No travel plan summary is available.",
      daySuffix: " days",
      spotSuffix: " spots",
      removeFavoriteTitle: "Remove from favorites",
    },
    myPageHeader: {
      title: "My Travel Plans",
      emptyMessage: "You have no saved travel plans",
      countPrefix: "Saved plans: ",
      countSuffix: "",
    },
    myPageEmpty: {
      description: "You have no saved travel plans.",
      cta: "Create an AI Travel Plan",
    },
    myPageCard: {
      summaryFallback: "No travel plan summary is available.",
      createdAtLabel: "Created: ",
      detailLabel: "View Details",
      deleteLabel: "Delete",
      backHomeLabel: "Back to Home",
    },
    myPage: {
      loading: "Loading...",
      loadFailedAlert: "Could not load your saved travel plans.",
      authFailedAlert:
        "Could not verify your authentication status. Please reload the page.",
      deleteConfirm: "Delete this travel plan?",
      deleteSuccessAlert: "Travel plan deleted.",
      deleteFailedAlert: "Could not delete the travel plan.",
    },
    myPageDetail: {
      invalidIdAlert: "The travel plan ID is invalid.",
      loadFailedAlert: "Could not load the travel plan.",
      authFailedAlert:
        "Could not verify your authentication status. Please reload the page.",
      loading: "Loading...",
      notFoundTitle: "Travel Plan Not Found",
      notFoundDescription:
        "This travel plan may have been deleted or may not exist.",
      backToMyPage: "Back to My Page",
      backToMyPageWithArrow: "← Back to My Page",
    },
    historyHeader: {
      title: "Saved Travel Plans",
      emptyMessage: "You have no saved travel plans",
      countPrefix: "Saved plans: ",
      countSuffix: "",
    },
    historySearch: {
      placeholder: "Search travel plans...",
    },
    historySort: {
      ariaLabel: "Sort order",
      newest: "Newest First",
      oldest: "Oldest First",
    },
    historyViewToggle: {
      gridAriaLabel: "Grid view",
      listAriaLabel: "List view",
    },
    historyEmpty: {
      description: "You have no saved travel plans.",
      cta: "Create an AI Travel Plan",
    },
    historyCard: {
      summaryFallback: "No travel plan summary is available.",
      openLabel: "Open",
      deleteLabel: "Delete",
    },
    historyPage: {
      loading: "Loading...",
      loadFailedAlert: "Could not load your travel history.",
      authFailedAlert:
        "Could not verify your authentication status. Please reload the page.",
      deleteConfirm: "Delete this travel plan?",
      deleteFailedAlert: "Could not delete the travel plan.",
    },
    historyDetail: {
      invalidIdAlert: "The travel plan ID is invalid.",
      loadFailedAlert: "Could not load the travel plan.",
      authFailedAlert:
        "Could not verify your authentication status. Please reload the page.",
      loading: "Loading...",
      notFoundTitle: "Travel Plan Not Found",
      backToDashboard: "← Back to Dashboard",
    },
    historyEdit: {
      invalidIdAlert: "The travel plan ID is invalid.",
      loadFailedAlert: "Could not load the travel plan.",
      authFailedAlert:
        "Could not verify your authentication status. Please reload the page.",
      authChangedAlert:
        "Your authentication status has changed. Please log in again.",
      requiredAlert: "Enter a title and summary.",
      titleTooLongAlert: "Enter a title of no more than 120 characters.",
      summaryTooLongAlert: "Enter a summary of no more than 2,000 characters.",
      saveSuccessAlert: "Saved",
      saveFailedAlert: "Could not save the travel plan.",
      title: "✏️ Edit Travel Plan",
      loading: "Loading...",
      titleLabel: "Title",
      summaryLabel: "Summary",
      savingLabel: "Saving...",
      saveLabel: "💾 Save",
    },
    spotCard: {
      travelDetails: "Travel Details",
      basicInformation: "Basic Information",
      addressLabel: "Address",
      hoursLabel: "Hours",
      priceLabel: "Price",
      areaLabel: "Area",
      spotInformation: "Spot Information",
      aboutSpot: "About This Spot",
      officialWebsiteAriaLabelSuffix: " official website in a new tab",
      officialWebsiteLabel: "View Official Website",
      mapPreview: "Map Preview",
      location: "Location",
    },
    spotsPage: {
      eyebrow: "KYOTO SPOT DATABASE",
      title: "Kyoto Spots",
      description: "Browse Kyoto's sightseeing spots.",
      countPrefix: "Total: ",
      countSuffix: " spots",
      areaPrefix: "📍 ",
      detailLink: "View Details →",
    },
    spotDetail: {
      backToSpots: "← Back to Spots",
      namePrefix: "📍 ",
      metadataSeparator: " · ",
      ratingPrefix: "⭐ ",
      ratingSuffix: " / 5",
      addressPrefix: "📍 ",
      addressLabel: "Address: ",
      hoursPrefix: "🕒 ",
      hoursLabel: "Hours: ",
      pricePrefix: "💴 ",
      priceLabel: "Admission: ",
      googleMapsLabel: "🗺 Google Maps",
      officialWebsiteLabel: "🌐 Official Website",
    },
    placeLink: {
      unknownSpot: "Unknown spot",
      detailAriaLabelSuffix: " details page",
    },
    placeImage: {
      photoAltSuffix: " photo",
    },
    placeGallery: {
      title: "📸 Sightseeing Spots",
    },
    travelMap: {
      unavailableMessage: "Map unavailable.",
      titlePrefix: "Map of ",
      titleSuffix: "",
    },
    globalLoading: {
      brandName: "Japan Travel Buddy",
      primaryMessage: "Creating your perfect Japan journey...",
      secondaryMessage: "Our AI is planning the best route for you.",
      searchingSpots: "🤖 Searching for recommended spots...",
      creatingRoute: "🗺️ Creating the best route...",
      finalizingPlan: "✨ Finalizing your travel plan...",
    },
    globalError: {
      title: "Something went wrong",
      description: "An unexpected error occurred.",
      retryMessage: "Please try again.",
      retryButton: "Try Again",
    },
    notFound: {
      title: "Page Not Found",
      description: "Sorry, the page you are looking for does not exist.",
      backToHome: "Back to Home",
    },
    chatInput: {
      inputLabel: "Message input",
      placeholder: "I want to travel around Kyoto for three days",
      sendingLabel: "Sending...",
      sendLabel: "Send",
    },
    chatMessages: {
      ariaLabel: "Chat messages",
    },
    messageBubble: {
      userAriaLabel: "User message",
      assistantAriaLabel: "AI message",
    },
    navbar: {
      home: "🏠 Home",
      aiTravel: "🤖 AI Travel",
      history: "📚 History",
      favorites: "⭐ Favorites",
      myPage: "👤 My Page",
    },
    aboutPage: {
      metadata: {
        title: "About | Japan Travel Buddy",
        description: "Learn more about Japan Travel Buddy",
      },
      title: "About Japan Travel Buddy",
      mission: {
        title: "Our Mission",
        description:
          "Japan Travel Buddy was created to make traveling in Japan easier, more enjoyable, and more personal through the power of AI.",
        benefit:
          "Instead of spending hours researching destinations, transportation, and itineraries, travelers can receive personalized travel plans in seconds.",
      },
      offer: {
        title: "What We Offer",
        features: [
          "AI-powered travel itinerary generation",
          "Curated sightseeing spot database",
          "Interactive maps",
          "Favorite travel plans",
          "PDF export",
          "Responsive experience across devices",
        ],
      },
      vision: {
        title: "Our Vision",
        description:
          "We aim to become the most trusted AI travel companion for visitors exploring Japan.",
        goal:
          "Our goal is to continuously improve the service by expanding destination coverage, enhancing AI recommendations, and delivering a better travel experience for every user.",
      },
    },
    contactPage: {
      metadata: { title: "Contact | Japan Travel Buddy", description: "Contact Japan Travel Buddy" },
      title: "Contact",
      introduction: "Thank you for using Japan Travel Buddy.",
      invitation: "If you have any questions, feedback, or suggestions, please feel free to contact us.",
      supportTitle: "Support",
      supportDescription: "We welcome bug reports, feature requests, and general inquiries.",
      contactMethodTitle: "Contact Method",
      contactMethodDescription: "Contact information will be available here before the official release.",
      responseTimeTitle: "Response Time",
      responseTimeDescription: "We aim to respond to inquiries as quickly as possible. Response times may vary depending on the volume of requests.",
    },
    privacyPage: {
      metadata: { title: "Privacy Policy | Japan Travel Buddy", description: "Privacy Policy for Japan Travel Buddy" },
      title: "Privacy Policy",
      informationTitle: "1. Information We Collect",
      informationDescription: "Japan Travel Buddy may collect information necessary to provide travel planning services, including your account information, travel preferences, and usage data.",
      useTitle: "2. How We Use Your Information",
      uses: ["Generate AI travel plans", "Save your favorite plans", "Improve the quality of our service", "Provide customer support"],
      thirdPartyTitle: "3. Third-Party Services",
      thirdPartyDescription: "This service uses third-party services including Firebase, OpenAI, and Google Maps Platform. These services may process information in accordance with their own privacy policies.",
      securityTitle: "4. Data Security",
      securityDescription: "We take reasonable measures to protect your information from unauthorized access, disclosure, alteration, or destruction.",
      changesTitle: "5. Changes to This Policy",
      changesDescription: "This Privacy Policy may be updated from time to time. The latest version will always be available on this page.",
      contactTitle: "6. Contact",
      contactDescription: "If you have any questions regarding this Privacy Policy, please contact us through the Contact page.",
    },
    termsPage: {
      metadata: { title: "Terms of Service | Japan Travel Buddy", description: "Terms of Service for Japan Travel Buddy" },
      title: "Terms of Service",
      acceptanceTitle: "1. Acceptance of Terms",
      acceptanceDescription: "By using Japan Travel Buddy, you agree to these Terms of Service.",
      serviceTitle: "2. Service Description",
      serviceDescription: "Japan Travel Buddy provides AI-powered travel planning tools, destination information, maps, and related features to assist users in planning trips within Japan.",
      responsibilitiesTitle: "3. User Responsibilities",
      responsibilities: ["Provide accurate account information.", "Use the service lawfully.", "Do not interfere with the operation of the service.", "Do not attempt unauthorized access."],
      aiContentTitle: "4. AI-Generated Content",
      aiContentDescription: "Travel plans are generated using AI and may contain inaccuracies. Users are responsible for verifying information such as opening hours, prices, transportation schedules, and reservation requirements before traveling.",
      intellectualPropertyTitle: "5. Intellectual Property",
      intellectualPropertyDescription: "The content, design, and software of Japan Travel Buddy are protected by applicable intellectual property laws unless otherwise stated.",
      disclaimerTitle: "6. Disclaimer",
      disclaimerDescription: "We do not guarantee that the service will always be uninterrupted, error-free, or suitable for every purpose. Use of the service is at your own discretion.",
      serviceChangesTitle: "7. Changes to the Service",
      serviceChangesDescription: "We may modify, suspend, or discontinue parts of the service at any time without prior notice.",
      termsChangesTitle: "8. Changes to These Terms",
      termsChangesDescription: "These Terms of Service may be updated from time to time. The latest version will always be available on this page.",
    },
    siteMetadata: {
      defaultTitle: "Japan Travel Buddy",
      titleTemplate: "%s | Japan Travel Buddy",
      description: "Plan your perfect trip to Japan with AI. Discover destinations, build personalized itineraries, explore interactive maps, and save your travel plans with Japan Travel Buddy.",
      keywords: ["Japan", "Travel", "Kyoto", "AI", "Travel Planner", "Japan Trip", "Itinerary", "Tourism", "OpenAI"],
      authorName: "Japan Travel Buddy",
      creator: "Japan Travel Buddy",
      applicationName: "Japan Travel Buddy",
      openGraphSiteName: "Japan Travel Buddy",
      openGraphTitle: "Japan Travel Buddy",
      openGraphDescription: "Create personalized Japan travel plans with AI.",
      openGraphImageAlt: "Japan Travel Buddy",
      twitterTitle: "Japan Travel Buddy",
      twitterDescription: "Create personalized Japan travel plans with AI.",
    },
    travelRouteMap: {
      title: "🗺️ Travel Route Map",
    },
  },
};

export function getMessages(locale: Locale): AppMessages {
  return messages[locale];
}
